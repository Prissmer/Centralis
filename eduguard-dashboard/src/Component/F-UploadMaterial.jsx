import React, { useState, useEffect } from "react";
import "./Style/F-Upload.css";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import { useAuth } from "../Context/AuthContext";

const Upload = () => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    subject: "",
    document_type: "",
    version: "",
    academic_year: "",
    semester: "",
    school_year: "",
    description: "",
    category: "",           // 🔥 ADDED: Tracks category for Cloudinary folders
    requirement_id: ""      // 🔥 ADDED: Tracks exact DB ID for the Checklist Matrix
  });

  const [requirements, setRequirements] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // 🔥 ADDED: Fetch requirement IDs from your existing endpoint so they map perfectly to A-Checklist
  useEffect(() => {
    const fetchRequirements = async () => {
      if (!formData.school_year || !formData.semester) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/compliance-checklist?semester=${formData.semester}&school_year=${formData.school_year}`
        );
        const data = await res.json();
        if (res.ok && data.requirements) {
          setRequirements(data.requirements);
        }
      } catch (error) {
        console.error("Failed to load checklist requirements", error);
      }
    };
    fetchRequirements();
  }, [formData.school_year, formData.semester]);

  // Compute available requirements based on the chosen category
  const availableRequirements = requirements.filter(
    (req) => req.category === formData.category
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Reset requirement_id if the user changes the category
      if (name === "category") {
        newData.requirement_id = "";
      }
      return newData;
    });
  };

  const validateAndSetFile = (file) => {
    if (file && file.size <= 50 * 1024 * 1024) {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus({ type: "error", message: "File too large (50MB max)" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      return setUploadStatus({ type: "error", message: "Please select a file." });
    }

    try {
      setUploadStatus({ type: "loading", message: "Processing your submission..." });

      const form = new FormData();
      form.append("file", selectedFile);
      form.append("userId", user?.id || "");

      // Append text fields dynamically (this will now include category and requirement_id)
      Object.keys(formData).forEach((key) => {
        form.append(key, formData[key]);
      });

      form.append("file_type", selectedFile.type);
      form.append("file_size", selectedFile.size);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload-material`, {
        method: "POST",
        body: form
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadStatus({
        type: "success",
        message: "Material submitted successfully!"
      });

      // Reset Form Fields
      setFormData({
        subject: "",
        document_type: "",
        version: "",
        academic_year: "",
        semester: "",
        school_year: "",
        description: "",
        category: "",
        requirement_id: ""
      });
      setSelectedFile(null);

      setTimeout(() => {
        setUploadStatus(null);
      }, 4000);

    } catch (err) {
      setUploadStatus({ type: "error", message: err.message });
    }
  };

  return (
    <div className="upload-container">
      <div className="upload">
        <div className="upload-header">
          <h2>Upload Materials</h2>
          <p>Submit your academic requirements and resources</p>
        </div>

        <div className="upload-content">
          {uploadStatus && (
            <div className={`status-message ${uploadStatus.type}`} style={{ marginBottom: '20px' }}>
              {uploadStatus.type === "loading" && <div className="loading-spinner"></div>}
              {uploadStatus.type === "success" && <FaCheckCircle />}
              {uploadStatus.type === "error" && <FaExclamationTriangle />}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          <div className="upload-card">
            <form onSubmit={handleSubmit} className="upload-form">
              <div className="form-grid">
                
                {/* 🔥 ADDED: Category Selection */}
                <div className="form-field">
                  <label className="form-label">Category <span className="required">*</span></label>
                  <select className="form-select" name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="">Select Category</option>
                    <option value="teacher_documents">Teacher Documents</option>
                    <option value="assessment">Assessments</option>
                    <option value="materials">Materials</option>
                  </select>
                </div>

                {/* 🔥 ADDED: Target Requirement Selection */}
                <div className="form-field">
                  <label className="form-label">Target Requirement <span className="required">*</span></label>
                  <select className="form-select" name="requirement_id" value={formData.requirement_id} onChange={handleInputChange} required disabled={!formData.category}>
                    <option value="">Select Requirement</option>
                    {availableRequirements.map((req) => (
                      <option key={req.requirement_id} value={req.requirement_id}>
                        {req.requirement_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">School Year <span className="required">*</span></label>
                  <input className="form-input" name="school_year" placeholder="e.g. 2025-2026" value={formData.school_year} onChange={handleInputChange} required />
                </div>

                <div className="form-field">
                  <label className="form-label">Semester</label>
                  <select className="form-select" name="semester" value={formData.semester} onChange={handleInputChange} required>
                    <option value="">Select Semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Subject <span className="required">*</span></label>
                  <select className="form-select" name="subject" value={formData.subject} onChange={handleInputChange} required>
                    <option value="">Select Subject</option>
                    <option>Data Structures</option>
                    <option>OOP</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Document Type <span className="required">*</span></label>
                  <select className="form-select" name="document_type" value={formData.document_type} onChange={handleInputChange} required>
                    <option value="">Select Type</option>
                    <option>Syllabus</option>
                    <option>Module</option>
                    <option>Exam</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Year Level <span className="required">*</span></label>
                  <select className="form-select" name="academic_year" value={formData.academic_year} onChange={handleInputChange} required>
                    <option value="">Select Year Level</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label">Version</label>
                  <input className="form-input" name="version" placeholder="e.g. 1.0" value={formData.version} onChange={handleInputChange} />
                </div>
              </div>

              <div
                className={`drop-zone ${dragActive ? "drag-active" : ""} ${selectedFile ? "has-file" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); validateAndSetFile(e.dataTransfer.files[0]); }}
                onClick={() => !selectedFile && document.getElementById("file-input").click()}
              >
                <input id="file-input" type="file" hidden onChange={(e) => validateAndSetFile(e.target.files[0])} />
                
                {!selectedFile ? (
                  <>
                    <div className="drop-zone-icon"><FaCloudUploadAlt /></div>
                    <div className="drop-zone-title">Click or drag file to upload</div>
                    <div className="drop-zone-subtitle">PDF, DOCX, PPTX (Max 50MB)</div>
                  </>
                ) : (
                  <div className="file-preview">
                    <div className="file-preview-info">
                      <div className="file-name">{selectedFile.name}</div>
                      <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <button type="button" className="remove-file" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" name="description" placeholder="Optional notes for the reviewer..." value={formData.description} onChange={handleInputChange} />
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={uploadStatus?.type === "loading"}>
                  {uploadStatus?.type === "loading" ? "Processing..." : "Submit Material"}
                </button>
                <button type="button" className="cancel-btn" onClick={() => window.history.back()}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;