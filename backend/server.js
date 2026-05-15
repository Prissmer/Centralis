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

// =========================
// 3. UPLOAD MATERIAL (TO CLOUDINARY & SUPABASE)
// =========================
app.post("/upload-material", upload.single("file"), async (req, res) => {
  try {
    const {
      subject,
      document_type,
      version,
      academic_year,
      school_year,
      semester,
      description,
      userId,
    } = req.body;

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // 🔥 A. UPLOAD TO CLOUDINARY
    const cloudForm = new FormData();
    cloudForm.append("file", file.buffer, { filename: file.originalname });
    cloudForm.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET);

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      { method: "POST", body: cloudForm }
    );

    const cloudData = await cloudRes.json();
    if (!cloudRes.ok) {
      console.error("Cloudinary Error:", cloudData);
      throw new Error("Cloudinary upload failed");
    }

    // 🔥 B. SAVE METADATA TO SUPABASE "submissions" TABLE
    const { error } = await supabase.from("submissions").insert({
      title: file.originalname,
      file_url: cloudData.secure_url,
      public_id: cloudData.public_id,
      uploaded_by: userId,
      subject: subject,
      document_type: document_type,
      version: version,
      academic_year: academic_year,
      school_year: school_year,
      semester: semester,
      description: description,
      file_type: file.mimetype,
      file_size: file.size,
      submission_status: "pending",
      approval_status: "pending",
    });

    if (error) {
      console.error("Supabase Error Details:", error);
      throw error;
    }

    res.json({ message: "Upload successful", url: cloudData.secure_url });
  } catch (err) {
    console.error("🔥 Server Upload Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===================================
// 4. REQUIREMENTS MANAGEMENT (WITH PAGINATION)
// ===================================

// GET Requirements with Pagination, Search, and Category Filtering
app.get("/requirements", async (req, res) => {
  // Parse query params
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const category = req.query.category || "";

  // Calculate inclusive range for Supabase
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    let query = supabase
      .from("requirements")
      .select("*", { count: "exact" }) // 'exact' is needed for frontend pager math
      .order("requirement_id", { ascending: true });

    // Apply Search Filter
    if (search) {
      query = query.ilike("requirement_name", `%${search}%`);
    }

    // Apply Category Filter
    if (category) {
      query = query.eq("category", category);
    }

    // Fetch the specific range (Server-Side Pagination)
    const { data, count, error } = await query.range(start, end);

    if (error) throw error;

    res.json({
      data,
      total: count, // Total items matching filters
      page,
      limit,
    });
  } catch (err) {
    console.error("🔥 Fetch Requirements Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST Create a new Requirement
app.post("/requirements", async (req, res) => {
  const { requirement_name, category, needs_approval, semester_based } = req.body;

  try {
    const { data, error } = await supabase.from("requirements").insert([
      {
        requirement_name,
        category,
        // Ensure boolean conversion
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



// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 EduGuard Server running on http://localhost:${PORT}`)
);