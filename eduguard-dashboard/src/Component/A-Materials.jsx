import React, { useState, useEffect } from 'react';
import "./Style/A-Materials.css";
import { FaSearch, FaFilePdf, FaDownload, FaUpload, FaFilter, FaPlus, FaTimes } from 'react-icons/fa';
import { useAuth } from "../Context/AuthContext";

const Materials = () => {
  const { user } = useAuth();
  
  // Data State
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab State (Switches between Materials and Assessments)
  const [activeTab, setActiveTab] = useState("materials");

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    subject: "",
    document_type: "Course Outline",
    school_year: "2025-2026",
    semester: "1st Semester",
    category: "materials" // Default selection
  });

  // Fetch Data based on Active Tab
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 8,
        search: searchTerm,
        subject: subjectFilter,
        date: dateFilter,
        category: activeTab // 🔥 Sends the current tab to the backend
      });
      
      const res = await fetch(`http://localhost:5000/api/materials?${queryParams}`);
      const data = await res.json();
      
      if (res.ok) {
        setMaterials(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when dependencies change (including activeTab)
  useEffect(() => {
    fetchMaterials();
  }, [page, searchTerm, subjectFilter, dateFilter, activeTab]);

  // Handle Upload Submission
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return alert("Please select a file first.");

    const formData = new FormData();
    formData.append("file", uploadForm.file);
    formData.append("subject", uploadForm.subject);
    formData.append("document_type", uploadForm.document_type);
    formData.append("school_year", uploadForm.school_year);
    formData.append("semester", uploadForm.semester);
    formData.append("userId", user?.id);
    formData.append("category", uploadForm.category); // Sends Materials or Assessment

    try {
      setUploading(true);
      const res = await fetch("http://localhost:5000/upload-material", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`${uploadForm.category === "materials" ? "Material" : "Assessment"} uploaded successfully!`);
      setIsModalOpen(false);
      setUploadForm({ ...uploadForm, file: null, subject: "" });
      fetchMaterials(); // Refresh list
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="materials-content">
      {/* HEADER */}
      <header className="materials-header">
        <div>
          <h2>Academic Resources</h2>
          <p>Manage and monitor uploaded faculty {activeTab === "materials" ? "materials" : "assessments"}</p>
        </div>
        <button className="btn-primary" onClick={() => {
          // 🔥 Automatically sets the dropdown to match your current tab!
          setUploadForm({ ...uploadForm, category: activeTab }); 
          setIsModalOpen(true);
        }}>
          <FaPlus /> Upload File
        </button>
      </header>

      {/* TABS NAVIGATION */}
      <div className="materials-tabs">
        <button 
          className={`tab-btn ${activeTab === "materials" ? "active" : ""}`} 
          onClick={() => { setActiveTab("materials"); setPage(1); }}
        >
            Materials
        </button>
        <button 
          className={`tab-btn ${activeTab === "assessment" ? "active" : ""}`} 
          onClick={() => { setActiveTab("assessment"); setPage(1); }}
        >
          Assessments
        </button>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="materials-toolbar">
        <div className="search-box">
          <FaSearch className="icon" />
          <input 
            type="text" 
            placeholder="Search by filename..." 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
        </div>
        
        <div className="filters">
          <div className="filter-input-group">
            <FaFilter className="filter-icon"/>
            <input 
              type="text" 
              placeholder="Filter by Subject..." 
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-input-group">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="materials-card table-responsive">
        <table className="materials-table">
          <thead>
            <tr>
              <th>FILE DETAILS</th>
              <th>SUBJECT</th>
              <th>UPLOADED BY</th>
              <th>UPLOAD DATE</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-4">Loading data...</td></tr>
            ) : materials.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-4">No {activeTab} found.</td></tr>
            ) : (
              materials.map((item, index) => (
                <tr key={item.submission_id || item.id || index}>
                  <td>
                    <div className="material-info">
                      <div className="pdf-icon-box"><FaFilePdf /></div>
                      <div>
                        <p className="m-title">{item.title || item.file_name}</p>
                        <p className="m-type">{item.document_type}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="subject-badge">{item.subject || "N/A"}</span></td>
                  <td className="m-author">Instructor</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-links">
                      <a href={item.file_url} target="_blank" rel="noreferrer" className="btn-view">View</a>
                      <a href={item.file_url} download target="_blank" rel="noreferrer" className="btn-download">
                        <FaDownload />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isModalOpen && (
        <div className="upload-modal-overlay">
          <div className="upload-modal">
            <div className="modal-header">
              <h3>Upload New File</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleUploadSubmit}>
              
              <div className="form-group">
                <label>Upload Destination (Tab)</label>
                <select required value={uploadForm.category} onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}>
                  <option value="materials">Materials</option>
                  <option value="assessment">Assessments</option>
                </select>
              </div>

              <div className="form-group">
                <label>Select File</label>
                <input type="file" required onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})} />
              </div>
              
              <div className="form-group">
                <label>Subject Code / Name</label>
                <input type="text" required placeholder="e.g., ITE 314" value={uploadForm.subject} onChange={(e) => setUploadForm({...uploadForm, subject: e.target.value})} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Document Type</label>
                  <select value={uploadForm.document_type} onChange={(e) => setUploadForm({...uploadForm, document_type: e.target.value})}>
                    {/* Shows different options based on the selected destination */}
                    {uploadForm.category === "materials" ? (
                      <>
                        <option value="Course Outline">Course Outline</option>
                        <option value="OBTLP">OBTLP</option>
                        <option value="PowerPoint">PowerPoint / Presentation</option>
                        <option value="Other">Other Material</option>
                      </>
                    ) : (
                      <>
                        <option value="Midterm Exam">Midterm Exam</option>
                        <option value="Final Exam">Final Exam</option>
                        <option value="Quiz / Assignment">Quiz / Assignment</option>
                        <option value="Other">Other Assessment</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Semester</label>
                  <select value={uploadForm.semester} onChange={(e) => setUploadForm({...uploadForm, semester: e.target.value})}>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-submit" disabled={uploading}>
                {uploading ? "Uploading to Cloudinary..." : "Upload File"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;