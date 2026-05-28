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
    origin: "http://localhost:5173", // Make sure this matches your React port!
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
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: "http://localhost:5173/update-password",
      data: { role: role },
    });
    if (error) throw error;
    
    await supabase.from("profiles").insert({ id: data.user.id, email, role, status: "active" });
    res.json({ message: "Invitation sent!" });
  } catch (err) {
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
// 3. FETCH MATERIALS WITH PAGINATION & FILTERS
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
      .select("*", { count: "exact" })
      .eq("category", category) 
      .order("created_at", { ascending: false });

    if (search) query = query.ilike("title", `%${search}%`);
    if (subject) query = query.ilike("subject", `%${subject}%`);
    if (date) query = query.gte("created_at", `${date}T00:00:00.000Z`).lte("created_at", `${date}T23:59:59.999Z`);

    const { data, count, error } = await query.range(start, end);
    if (error) throw error;

    res.json({ data, total: count, page, limit, totalPages: Math.ceil(count / limit) });
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
  const { requirement_name, category, needs_approval, semester_based, due_date, grace_period_hours, auto_reminders } = req.body;
  try {
    const { data, error } = await supabase.from("requirements").insert([{
        requirement_name, category,
        needs_approval: needs_approval === "true" || needs_approval === true,
        semester_based: semester_based === "true" || semester_based === true,
        due_date: due_date || null,
        grace_period_hours: parseInt(grace_period_hours) || 0,
        auto_reminders: auto_reminders === "true" || auto_reminders === true,
        active: true, 
    }]).select();
    
    if (error) throw error;

    // 🔥 UPDATED: Added category for smart routing
    io.emit("admin_notification", {
      type: "NEW_REQUIREMENT",
      title: "New Requirement Added",
      message: `The admin added a new requirement: "${requirement_name}" in ${category.replace("_", " ")}.`,
      category: category, 
      time: new Date().toISOString()
    });

    res.json({ message: "Requirement successfully created!", data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/requirements/bulk-deadline", async (req, res) => {
  const { requirement_ids, due_date, grace_period_hours, auto_reminders, category } = req.body;
  try {
    const { data, error } = await supabase.from("requirements").update({
        due_date: due_date || null,
        grace_period_hours: parseInt(grace_period_hours) || 0,
        auto_reminders: auto_reminders === true
      }).in("requirement_id", requirement_ids).select();

    if (error) throw error;

    // 🔥 UPDATED: Added category and better messaging
    io.emit("admin_notification", {
      type: "NEW_DEADLINE",
      title: "Deadlines Updated",
      message: `The admin updated deadlines for ${requirement_ids.length} items in ${category ? category.replace("_", " ") : 'requirements'}.`,
      category: category || "materials", // Fallback just in case
      date: due_date
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
      .eq("role", "instructor");

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
      remarks: status === "rejected" ? remarks : null,
      approved_by: status === "approved" ? admin_id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null
    };

    const { data: subData, error: subError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", submission_id) 
      .select();

    if (subError) throw subError;

    const { error: auditError } = await supabase.from("audit_logs").insert({
      user_id: admin_id,
      action: status === "approved" ? "Approve File" : "Reject File",
      target_table: "submissions",
      target_id: submission_id, 
      description: `Admin ${status} submission ID ${submission_id}`
    });

    if (auditError) console.error("Audit log failed (non-fatal):", auditError.message);

    // 🔥 THE MISSING FIX: Broadcast the approval/rejection to the Faculty!
    const docTitle = subData[0]?.title || "Your document";
    io.emit("admin_notification", {
      type: status === "approved" ? "APPROVAL" : "REJECTION",
      title: `Document ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `"${docTitle}" was ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`,
      time: new Date().toISOString()
    });

    res.json({ message: "Review processed successfully", data: subData });
  } catch (err) {
    console.error("🔥 Submission Review Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 7. PDF PROXY (Forces inline display for Cloudinary raw PDFs)
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