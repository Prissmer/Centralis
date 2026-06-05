import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import fetch from "node-fetch";

// 🔥 NEW: Import HTTP and Socket.io
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 NEW: Wrap Express in an HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: "https://centralis-dashboard.onrender.com", // Make sure this matches your React port!
    methods: ["GET", "POST", "PUT", "DELETE"] 
  } 
});

// 🔥 NEW: Track active users for WebSockets
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // When a user logs in, the frontend will send their user ID
  socket.on("register_user", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} registered to socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    // Find and remove the user from our active map
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`🔌 User ${userId} disconnected`);
        break;
      }
    }
  });
});

// ✅ SUPABASE CONFIG
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ MULTER CONFIG (Storage in memory)
const upload = multer();

// ==========================================================================
// 1. SYSTEM ROUTES
// ==========================================================================
app.get("/", (req, res) => res.send("EduGuard Backend is running"));

// ==========================================================================
// 2. USER MANAGEMENT (ADMIN)
// ==========================================================================
app.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/create-user", async (req, res) => {
  const { email, role } = req.body;
  try {
    // Normalize role
    let normalizedRole = role.toLowerCase().trim();
    if (normalizedRole === "lead instructor") normalizedRole = "lead_instructor";

    let userId = null;

    // 1. Check if user already exists in Auth
    console.log(`[CREATE-USER] Processing user: ${email} with role: ${normalizedRole}`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingAuthUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingAuthUser) {
      console.log(`[CREATE-USER] User already exists in Auth! ID: ${existingAuthUser.id}`);
      userId = existingAuthUser.id;
      // Sync auth metadata
      await supabase.auth.admin.updateUserById(userId, { user_metadata: { role: normalizedRole } });
    } else {
      console.log(`[CREATE-USER] Inviting new user...`);
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: "http://localhost:5173/update-password",
        data: { role: normalizedRole },
      });
      if (inviteError) throw inviteError;
      userId = inviteData.user.id;
    }

    // 2. Check if user exists in profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      console.log(`[CREATE-USER] User missing in profiles table. Inserting...`);
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId, email, role: normalizedRole, status: "active" });
      if (insertError) throw insertError;
    } else {
      console.log(`[CREATE-USER] User already in profiles table. Updating role...`);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: normalizedRole, status: "active" })
        .eq("id", userId);
      if (updateError) throw updateError;
    }

    res.json({ message: existingAuthUser ? "Existing account restored and linked successfully!" : "Invitation sent successfully!" });
  } catch (err) {
    console.error("[CREATE-USER] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  try {
    const { error } = await supabase.from("profiles").update({ role, status }).eq("id", id);
    if (error) throw error;
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const { error } = await supabase.auth.admin.deleteUser(req.params.id);
    if (error) throw error;
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 3. FETCH MATERIALS WITH PAGINATION & FILTERS (with uploader displayname)
// ==========================================================================
app.get("/api/materials", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const subject = req.query.subject || "";
  const date = req.query.date || "";
  const category = req.query.category || "materials"; 

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let query = supabase
      .from("submissions")
      .select("*, profiles:uploaded_by(display_name, first_name, last_name)", { count: "exact" })
      .eq("category", category) 
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("title", `%${search}%`);
    if (subject) query = query.ilike("subject", `%${subject}%`);
    if (date) query = query.gte("created_at", `${date}T00:00:00.000Z`).lte("created_at", `${date}T23:59:59.999Z`);

    const year_level = req.query.year_level || "";
    const semester_filter = req.query.semester || "";
    if (year_level) query = query.eq("academic_year", year_level);
    if (semester_filter) query = query.eq("semester", semester_filter);

    const { data, count, error } = await query.range(start, end);
    if (error) throw error;

    // Map displayname onto each record
    const enriched = (data || []).map(item => {
      const p = item.profiles;
      const uploaderName = p ? (p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()) : 'Unknown';
      return { ...item, uploader_name: uploaderName };
    });

    res.json({ data: enriched, total: count, page, limit, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error("🔥 Fetch Materials Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 4. UPLOAD TO CLOUDINARY & SUPABASE (PURE JSON METHOD)
// ==========================================================================
app.post("/upload-material", upload.single("file"), async (req, res) => {
  try {
    const { 
      subject, document_type, version, academic_year, school_year, 
      semester, description, userId, category, requirement_id 
    } = req.body;
    
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) throw new Error("Could not fetch user profile for folder routing.");

    const safeSchoolYear = school_year ? school_year.replace(/\s+/g, '_') : 'Unknown_Year';
    const safeSemester = semester ? semester.replace(/\s+/g, '_') : 'Unknown_Semester';
    const cleanFirstName = userProfile.first_name ? userProfile.first_name.replace(/\s+/g, '_') : 'User';
    const cleanLastName = userProfile.last_name ? userProfile.last_name.replace(/\s+/g, '_') : '';
    const shortId = userId.substring(0, 6); 
    
    const teacherFolderName = `${cleanFirstName}_${cleanLastName}_${shortId}`;

    let folderPath = "";
    
    if (category === "teacher_documents") {
        folderPath = `Centralis/Faculty_Requirements/${safeSchoolYear}/${safeSemester}/${teacherFolderName}/Teacher_Documents`;
    } else if (category === "assessment") {
        // Fixed spelling to "Assessment" and added year/semester organizing
        folderPath = `Centralis/Assessment/${safeSchoolYear}/${safeSemester}`;
    } else {
        // Materials is the default fallback, now with year/semester organizing
        folderPath = `Centralis/Materials/${safeSchoolYear}/${safeSemester}`;
    }

    let b64 = Buffer.from(file.buffer).toString("base64");
    let mimeType = file.mimetype;

    if (file.size === 0) {
        console.log("Empty test file detected! Injecting dummy data for Cloudinary...");
        b64 = Buffer.from("This is a dummy file generated for testing purposes.").toString("base64");
        mimeType = "text/plain"; 
    }

    const dataURI = `data:${mimeType};base64,${b64}`;

    let resourceType = 'raw';
    if (mimeType.startsWith('image/')) resourceType = 'image';
    else if (mimeType.startsWith('video/')) resourceType = 'video';

    const safeFilename = file.originalname.replace(/[\/\\]/g, '_').replace(/\s+/g, '_');

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            file: dataURI,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
            folder: folderPath,
            filename_override: safeFilename
        })
    });
    
    const cloudData = await cloudRes.json();
    
    if (!cloudRes.ok) {
        console.error("🔥 Detailed Cloudinary Error:", cloudData);
        throw new Error(`Cloudinary Error: ${cloudData.error?.message || "Unknown"}`);
    }

    const { error } = await supabase.from("submissions").insert({
      title: file.originalname,
      file_url: cloudData.secure_url,
      public_id: cloudData.public_id,
      uploaded_by: userId,
      subject: subject || null, 
      document_type: document_type,
      academic_year: academic_year || null,
      school_year: school_year,
      semester: semester,
      file_type: file.mimetype,
      file_size: file.size,
      submission_status: "submitted", 
      approval_status: "pending",
      category: category, 
      requirement_id: requirement_id ? requirement_id : null 
    });

    if (error) throw error;
    res.json({ message: "Upload successful", url: cloudData.secure_url });

  } catch (err) {
    console.error("🔥 Server Upload Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 5. REQUIREMENTS MANAGEMENT (WITH DEADLINES & WEBSOCKETS)
// ==========================================================================
app.get("/requirements", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const category = req.query.category || "";

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let query = supabase
      .from("requirements")
      .select("*", { count: "exact" })
      .order("requirement_id", { ascending: true });

    if (search) query = query.ilike("requirement_name", `%${search}%`);
    if (category) query = query.eq("category", category);

    const { data, count, error } = await query.range(start, end);
    if (error) throw error;

    res.json({ data, total: count, page, limit });
  } catch (err) {
    console.error("🔥 Fetch Requirements Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/requirements", async (req, res) => {
  const { requirement_name, category, needs_approval, semester_based, due_date, auto_reminders, assigned_roles, assigned_users } = req.body;
  try {
    const { data, error } = await supabase.from("requirements").insert([{
        requirement_name, category,
        needs_approval: needs_approval === "true" || needs_approval === true,
        semester_based: semester_based === "true" || semester_based === true,
        due_date: due_date || null,
        auto_reminders: auto_reminders === "true" || auto_reminders === true,
        assigned_roles: assigned_roles || ['instructor', 'lead_instructor'],
        assigned_users: assigned_users || [],
        active: true, 
    }]).select();
    
    if (error) throw error;

    // Single notification — includes deadline info if set
    const hasDueDate = !!due_date;
    const dueDateFormatted = hasDueDate ? new Date(due_date).toLocaleString() : null;
    const categoryLabel = (category || '').replace("_", " ");

    io.emit("admin_notification", {
      type: hasDueDate ? "NEW_REQUIREMENT_WITH_DEADLINE" : "NEW_REQUIREMENT",
      title: "New Requirement Added",
      message: hasDueDate 
        ? `A new requirement "${requirement_name}" has been added under ${categoryLabel} with a deadline on ${dueDateFormatted}. Please submit before the due date.`
        : `A new requirement "${requirement_name}" has been added under ${categoryLabel}. Please check your requirements page.`,
      category: category,
      requirementName: requirement_name,
      dueDate: due_date || null,
      time: new Date().toISOString(),
      assigned_roles: assigned_roles || ['instructor', 'lead_instructor'],
      assigned_users: assigned_users || []
    });

    res.json({ message: "Requirement successfully created!", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update assignments for a specific requirement
app.put("/requirements/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assigned_roles, assigned_users } = req.body;
  
  try {
    const { data, error } = await supabase.from("requirements").update({
      assigned_roles: assigned_roles || [],
      assigned_users: assigned_users || []
    }).eq("requirement_id", id).select();

    if (error) throw error;

    if (data && data.length > 0) {
      const req = data[0];
      io.emit("admin_notification", {
        type: "REQUIREMENT_ASSIGNED",
        title: "Requirement Assigned",
        message: `You have been assigned a new requirement: "${req.requirement_name}".`,
        category: req.category,
        requirementName: req.requirement_name,
        dueDate: req.due_date,
        time: new Date().toISOString(),
        assigned_roles: req.assigned_roles,
        assigned_users: req.assigned_users
      });
    }

    res.json({ message: "Assignments updated successfully!", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/requirements/bulk-deadline", async (req, res) => {
  const { requirement_ids, due_date, auto_reminders, category } = req.body;
  try {
    const { data, error } = await supabase.from("requirements").update({
        due_date: due_date || null,
        auto_reminders: auto_reminders === true
      }).in("requirement_id", requirement_ids).select();

    if (error) throw error;

    const requirementNames = data ? data.map(r => r.requirement_name).join(', ') : 'Selected requirements';

    // 🔥 UPDATED: Added category and better messaging with specific requirement names
    io.emit("admin_notification", {
      type: "NEW_DEADLINE",
      title: "Deadlines Updated",
      message: `The admin has set new deadlines for: ${requirementNames}. Due date: ${due_date ? new Date(due_date).toLocaleString() : 'Not set'}.`,
      category: category || "materials",
      date: due_date,
      requirementNames: requirementNames,
      count: requirement_ids.length,
      assignedItems: data // Pass full data to filter assignments client-side

    });

    res.json({ message: "Deadlines updated successfully", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 6. COMPLIANCE CHECKLIST & APPROVAL MATRIX
// ==========================================================================
app.get("/api/compliance-checklist", async (req, res) => {
  const { semester, school_year } = req.query;

  try {
    const { data: teachers, error: teachersError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, status, specialization, employment_status")
      .in("role", ["instructor", "lead_instructor"]);

    if (teachersError) throw teachersError;

    const { data: requirements, error: reqsError } = await supabase
      .from("requirements")
      .select("*")
      .eq("active", true);

    if (reqsError) throw reqsError;

    let query = supabase
      .from("submissions")
      .select("*")
      .eq("archived", false); 

    if (semester) query = query.eq("semester", semester);
    if (school_year) query = query.eq("school_year", school_year);

    const { data: submissions, error: subsError } = await query;
    if (subsError) throw subsError;

    res.json({ teachers, requirements, submissions });
  } catch (err) {
    console.error("🔥 Compliance Engine Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/submissions/review", async (req, res) => {
  const { submission_id, status, remarks, admin_id } = req.body;

  try {
    const updateData = {
      approval_status: status, 
      remarks: remarks || null,
      approved_by: status === "approved" ? admin_id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null
    };

    const { data: subData, error: subError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", submission_id) 
      .select();

    if (subError) throw subError;

    const { error: auditError } = await supabase.from("log_history").insert({
      user_id: admin_id,
      action: "Acknowledge File",
      target_table: "submissions",
      target_id: submission_id, 
      description: `Admin acknowledged submission ID ${submission_id}`
    });

    if (auditError) console.error("Audit log failed (non-fatal):", auditError.message);

    const docTitle = subData[0]?.title || "Your document";
    const uploadedBy = subData[0]?.uploaded_by;
    io.emit("admin_notification", {
      type: "ACKNOWLEDGMENT",
      title: "Document Acknowledged",
      message: `"${docTitle}" was acknowledged.`,
      target_user_id: uploadedBy,
      time: new Date().toISOString()
    });

    res.json({ message: "Review processed successfully", data: subData });
  } catch (err) {
    console.error("🔥 Submission Review Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 6b. FILE REPLACEMENT ENDPOINT
// ==========================================================================
app.put("/api/submissions/replace-file", upload.single("file"), async (req, res) => {
  try {
    const { submission_id, userId, category, school_year, semester, academic_year, subject } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!submission_id) return res.status(400).json({ error: "Missing submission_id" });

    // Get user profile for folder routing
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) throw new Error("Could not fetch user profile.");

    const safeSchoolYear = (school_year || '2025-2026').replace(/\s+/g, '_');
    const safeSemester = (semester || '1st_Semester').replace(/\s+/g, '_');
    const cleanFirstName = (userProfile.first_name || 'User').replace(/\s+/g, '_');
    const cleanLastName = (userProfile.last_name || '').replace(/\s+/g, '_');
    const shortId = userId.substring(0, 6);
    const teacherFolderName = `${cleanFirstName}_${cleanLastName}_${shortId}`;

    let folderPath = "";
    if (category === "teacher_documents") {
      folderPath = `Centralis/Faculty_Requirements/${safeSchoolYear}/${safeSemester}/${teacherFolderName}/Teacher_Documents`;
    } else if (category === "assessment") {
      folderPath = `Centralis/Assessment/${safeSchoolYear}/${safeSemester}`;
    } else {
      folderPath = `Centralis/Materials/${safeSchoolYear}/${safeSemester}`;
    }

    let b64 = Buffer.from(file.buffer).toString("base64");
    let mimeType = file.mimetype;

    if (file.size === 0) {
      b64 = Buffer.from("Dummy replacement file.").toString("base64");
      mimeType = "text/plain";
    }

    const dataURI = `data:${mimeType};base64,${b64}`;
    let resourceType = 'raw';
    if (mimeType.startsWith('image/')) resourceType = 'image';
    else if (mimeType.startsWith('video/')) resourceType = 'video';

    const safeFilename = file.originalname.replace(/[\/\\]/g, '_').replace(/\s+/g, '_');

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: dataURI,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        folder: folderPath,
        filename_override: safeFilename
      })
    });

    const cloudData = await cloudRes.json();
    if (!cloudRes.ok) throw new Error(`Cloudinary Error: ${cloudData.error?.message || "Unknown"}`);

    // Update the existing submission record
    const { error: updateError } = await supabase
      .from("submissions")
      .update({
        title: file.originalname,
        file_url: cloudData.secure_url,
        public_id: cloudData.public_id,
        file_type: file.mimetype,
        file_size: file.size,
        approval_status: "pending",
        academic_year: academic_year || null,
        semester: semester || null,
        subject: subject || null
      })
      .eq("id", submission_id);

    if (updateError) throw updateError;

    res.json({ message: "File replaced successfully", url: cloudData.secure_url });
  } catch (err) {
    console.error("🔥 File Replacement Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 7. DOWNLOAD TRACKING
// ==========================================================================
app.post("/api/downloads", async (req, res) => {
  const { user_id, submission_id, file_name, file_url, subject, file_type, file_size } = req.body;
  try {
    // Check if this user already downloaded this file
    const { data: existing } = await supabase
      .from("downloads")
      .select("*")
      .eq("user_id", user_id)
      .eq("submission_id", submission_id)
      .maybeSingle();

    if (existing) {
      // Update count and timestamp
      const { error } = await supabase.from("downloads").update({
        download_count: (existing.download_count || 1) + 1,
        downloaded_at: new Date().toISOString()
      }).eq("id", existing.id);
      if (error) throw error;
    } else {
      // Insert new download record
      const { error } = await supabase.from("downloads").insert({
        user_id, submission_id, file_name, file_url, subject,
        file_type, file_size, download_count: 1,
        downloaded_at: new Date().toISOString()
      });
      if (error) throw error;
    }

    // Audit log
    await supabase.from("log_history").insert({
      user_id,
      action: "File Download",
      target_table: "submissions",
      target_id: submission_id,
      description: `Downloaded file: ${file_name}`
    });

    res.json({ message: "Download tracked" });
  } catch (err) {
    console.error("🔥 Download Track Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/downloads/:userId", async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let query = supabase
      .from("downloads")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("downloaded_at", { ascending: false });

    if (search) query = query.ilike("file_name", `%${search}%`);

    const { data, count, error } = await query.range(start, end);
    if (error) throw error;

    res.json({ data: data || [], total: count, page, limit, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error("🔥 Fetch Downloads Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 8. DASHBOARD STATS
// ==========================================================================
app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: totalMaterials } = await supabase.from("submissions").select("*", { count: "exact", head: true });
    const { count: pendingCount } = await supabase.from("submissions").select("*", { count: "exact", head: true }).eq("approval_status", "pending");
    const { count: approvedCount } = await supabase.from("submissions").select("*", { count: "exact", head: true }).eq("approval_status", "approved");

    // Recent activity from log_history
    const { data: recentLogs } = await supabase
      .from("log_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    // Manual profile lookup
    const userIds = [...new Set((recentLogs || []).map(l => l.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, first_name, last_name").in("id", userIds);
      (profiles || []).forEach(p => {
        profileMap[p.id] = p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
      });
    }

    const enrichedLogs = (recentLogs || []).map(log => ({
      ...log,
      user_display_name: profileMap[log.user_id] || 'System'
    }));

    res.json({ totalUsers, totalMaterials, pendingCount, approvedCount, recentLogs: enrichedLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 9. AUDIT LOGS WITH PAGINATION & DISPLAYNAME
// ==========================================================================
app.get("/api/audit-logs", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const action = req.query.action || "";
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let query = supabase
      .from("log_history")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("description", `%${search}%`);
    if (action && action !== "All Actions") query = query.ilike("action", `%${action}%`);

    const { data, count, error } = await query.range(start, end);
    if (error) throw error;

    // Manual profile lookup (no FK required)
    const userIds = [...new Set((data || []).map(l => l.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, first_name, last_name").in("id", userIds);
      (profiles || []).forEach(p => {
        profileMap[p.id] = p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
      });
    }

    const enriched = (data || []).map(log => ({
      ...log,
      user_display_name: profileMap[log.user_id] || 'System'
    }));

    res.json({ data: enriched, total: count, page, limit, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==========================================================================
// 10. LOG HISTORY WITH PAGINATION & DISPLAYNAME
// ==========================================================================
app.get("/api/log-history", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const action = req.query.action || "";
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let query = supabase
      .from("log_history")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("description", `%${search}%`);
    if (action && action !== "All Actions") query = query.ilike("action", `%${action}%`);

    const { data, count, error } = await query.range(start, end);
    if (error) throw error;

    // Manual profile lookup (no FK required)
    const userIds = [...new Set((data || []).map(l => l.user_id).filter(Boolean))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, first_name, last_name").in("id", userIds);
      (profiles || []).forEach(p => {
        profileMap[p.id] = p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown';
      });
    }

    const enriched = (data || []).map(log => ({
      ...log,
      user_display_name: profileMap[log.user_id] || 'System'
    }));

    res.json({ data: enriched, total: count, page, limit, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 11. PDF PROXY (Forces inline display for Cloudinary raw PDFs)
// ==========================================================================
app.get("/api/proxy-pdf", async (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).json({ error: "Missing url parameter" });

  try {
    console.log("📄 PDF Proxy fetching:", fileUrl);
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      console.error("📄 Cloudinary responded with:", response.status, response.statusText);
      throw new Error(`Cloudinary returned ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("📄 PDF Proxy success, size:", buffer.length, "bytes");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch (err) {
    console.error("🔥 PDF Proxy Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// START SERVER
// ==========================================================================
const PORT = process.env.PORT || 5000;

// 🔥 CHANGED: We now listen using the new HTTP 'server' so WebSockets work!
server.listen(PORT, () =>
  console.log(`🚀 Centralis Server & WebSockets running on http://localhost:${PORT}`)
);