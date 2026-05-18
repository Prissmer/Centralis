import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ SUPABASE CLIENT (ADMIN)
// Uses SERVICE_ROLE_KEY to bypass RLS for administrative tasks
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ MULTER CONFIG (Storage in memory for Cloudinary forwarding)
const upload = multer();

// =========================
// 1. SYSTEM ROUTES
// =========================
app.get("/", (req, res) => res.send("EduGuard Backend is running"));

// =========================
// 2. USER MANAGEMENT (ADMIN)
// =========================

// Fetch all users
app.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Invite a new user
app.post("/create-user", async (req, res) => {
  const { email, role } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: "http://localhost:5173/update-password",
      data: { role: role },
    });
    if (error) throw error;
    
    // Insert profile after successful invitation
    await supabase
      .from("profiles")
      .insert({ id: data.user.id, email, role, status: "active" });
    
    res.json({ message: "Invitation sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role or status
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role, status })
      .eq("id", id);
    if (error) throw error;
    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user
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
// FETCH MATERIALS WITH PAGINATION & FILTERS
// ==========================================================================
// ==========================================================================
// FETCH MATERIALS WITH PAGINATION & FILTERS (BULLETPROOF VERSION)
// ==========================================================================
// ==========================================================================
// DIAGNOSTIC FETCH MATERIALS ROUTE
// ==========================================================================
// ==========================================================================
app.get("/api/materials", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const subject = req.query.subject || "";
  const date = req.query.date || "";
  
  // 🔥 NEW: Gets the active tab from the frontend (defaults to materials)
  const category = req.query.category || "materials"; 

  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let query = supabase
      .from("submissions")
      .select("*", { count: "exact" })
      .eq("category", category) // 🔥 NEW: Only fetches files for the active tab
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
// 2. UPLOAD TO CLOUDINARY & SUPABASE
// ==========================================================================
app.post("/upload-material", upload.single("file"), async (req, res) => {
  try {
    // 🔥 THE FIX IS HERE: We make sure requirement_id is extracted from req.body
    const { 
      subject, 
      document_type, 
      version, 
      academic_year, 
      school_year, 
      semester, 
      description, 
      userId, 
      category,
      requirement_id 
    } = req.body;
    
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Determine Cloudinary folder based on dropdown choice
    let folderCategory = "Uncategorized";
    if (category === "materials") folderCategory = "Materials";
    else if (category === "assessment") folderCategory = "Assessment";

    const folderPath = `Centralis/${folderCategory}/${school_year}/${semester}`;

    // A. Upload to Cloudinary
    const cloudForm = new FormData();
    cloudForm.append("file", file.buffer, { filename: file.originalname });
    cloudForm.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET);
    cloudForm.append("folder", folderPath);
    
    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`, { method: "POST", body: cloudForm });
    const cloudData = await cloudRes.json();
    if (!cloudRes.ok) throw new Error("Cloudinary upload failed");

    // B. Save to Supabase
    const { error } = await supabase.from("submissions").insert({
      title: file.originalname,
      file_url: cloudData.secure_url,
      public_id: cloudData.public_id,
      uploaded_by: userId,
      subject: subject,
      document_type: document_type,
      school_year: school_year,
      semester: semester,
      file_type: file.mimetype,
      file_size: file.size,
      submission_status: "submitted", 
      approval_status: "pending",
      category: category, 
      // Safely insert the requirement_id or leave it NULL if it's a freestyle upload
      requirement_id: requirement_id ? requirement_id : null 
    });

    if (error) throw error;
    res.json({ message: "Upload successful", url: cloudData.secure_url });
  } catch (err) {
    console.error("🔥 Server Upload Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===================================
// 4. REQUIREMENTS MANAGEMENT (WITH PAGINATION)
// ===================================

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
  const { 
      subject, 
      document_type, 
      version, 
      academic_year, 
      school_year, 
      semester, 
      description, 
      userId, 
      category,
      requirement_id // 🔥 NEW: Catch the bridge ID if it's sent
    } = req.body;

  try {
    const { data, error } = await supabase.from("requirements").insert([
      {
        requirement_name,
        category,
        needs_approval: needs_approval === "true" || needs_approval === true,
        semester_based: semester_based === "true" || semester_based === true,
        active: true,
      },
    ]);
    if (error) throw error;
    res.json({ message: "Requirement successfully created!", data });
  } catch (err) {
    console.error("🔥 Create Requirement Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================================
// 5. NEW: COMPLIANCE CHECKLIST & APPROVAL MATRIX
// ==========================================================================

// GET Aggregate data for the Checklist Matrix
app.get("/api/compliance-checklist", async (req, res) => {
  const { semester, school_year } = req.query;

  try {
    // 1. Fetch Instructors
    const { data: teachers, error: teachersError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, status, specialization, employment_status")
      // CHANGE THIS LINE to filter specifically for "instructor"
      .eq("role", "instructor");

    if (teachersError) throw teachersError;

    // 2. Fetch Active Requirements
    const { data: requirements, error: reqsError } = await supabase
      .from("requirements")
      .select("*")
      .eq("active", true);

    if (reqsError) throw reqsError;

    // 3. Fetch Submissions (Filtered by semester/year if applicable)
    let query = supabase
      .from("submissions")
      .select("*")
      .eq("archived", false); // Only get active, non-archived files

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

// POST Approve or Reject a specific submission
app.post("/api/submissions/review", async (req, res) => {
  const { submission_id, status, remarks, admin_id } = req.body;

  try {
    // 1. Update the Submission record
    const updateData = {
      approval_status: status, // 'approved' or 'rejected'
      remarks: status === "rejected" ? remarks : null,
      approved_by: status === "approved" ? admin_id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null
    };

    const { data: subData, error: subError } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("submission_id", submission_id) // Make sure this matches your PK column name
      .select();

    if (subError) throw subError;

    // 2. Log action to Audit Logs (from your DB spec)
    const { error: auditError } = await supabase.from("audit_logs").insert({
      user_id: admin_id,
      action: status === "approved" ? "Approve File" : "Reject File",
      target_table: "submissions",
      target_id: submission_id, // INT or UUID matching your schema
      description: `Admin ${status} submission ID ${submission_id}`
    });

    if (auditError) console.error("Audit log failed (non-fatal):", auditError.message);

    res.json({ message: "Review processed successfully", data: subData });
  } catch (err) {
    console.error("🔥 Submission Review Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 EduGuard Server running on http://localhost:${PORT}`)
);