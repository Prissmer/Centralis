import React, { useState, useEffect, useMemo } from "react";
import { 
  FaSearch, FaDownload, FaPrint, FaCheckCircle, 
  FaTimesCircle, FaClock, FaExclamationTriangle, FaLock, FaEye 
} from "react-icons/fa";
import { useAuth } from "../Context/AuthContext";
import "./Style/A-Checklist.css";

// Helper: Cloudinary serves PDFs uploaded via /auto/ as 'raw' (Content-Disposition: attachment = auto-download).
// Route through our backend proxy which re-serves with Content-Disposition: inline.
const getInlinePdfUrl = (url) => {
  if (!url) return url;
  return `http://localhost:5000/api/proxy-pdf?url=${encodeURIComponent(url)}`;
};

const AChecklist = () => {
  const { user } = useAuth();

  // --- STATE SYSTEM CONTROLS ---
  const [activeCategory, setActiveCategory] = useState("teacher_documents"); 
  const [teachers, setTeachers] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state mapping
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [employmentFilter, setEmploymentFilter] = useState("All");
  const [schoolYear, setSchoolYear] = useState("2025-2026");
  const [semester, setSemester] = useState("1st Semester");

  // Review Drawer state configuration
  const [selectedCell, setSelectedCell] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // --- GET RELEVANT BACKEND AGGREGATIONS ---
  const fetchChecklistData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/compliance-checklist?semester=${semester}&school_year=${schoolYear}`
      );
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to load database elements");
      
      setTeachers(data.teachers || []);
      setRequirements(data.requirements || []);
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error("Aggregation fetching error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklistData();
  }, [semester, schoolYear]);

  // --- COMPUTE ACTIVE REQUIREMENTS FILTER ---
  const currentColumns = useMemo(() => {
    return requirements.filter(req => req.category === activeCategory);
  }, [requirements, activeCategory]);

  // --- COMPUTE MATRIX INTERSECTION MAP ---
  const matrix = useMemo(() => {
    const map = {};
    teachers.forEach(t => {
      map[t.id] = {};
      currentColumns.forEach(c => {
        // 🔥 THE FIX: We must use uploaded_by to match your Supabase database schema!
        const sub = submissions.find(
          s => s.uploaded_by === t.id && s.requirement_id === c.requirement_id 
        );
        map[t.id][c.requirement_id] = sub || null;
      });
    });
    return map;
  }, [teachers, currentColumns, submissions]);

  // --- COMPLIANCE STATUS LOGIC ENGINE ---
  const renderStatus = (sub, needsApproval) => {
    if (!sub || sub.submission_status === "missing") {
      return <span className="status-cell missing"><FaTimesCircle /> Missing</span>;
    }

    if (!needsApproval) {
      return <span className="status-cell submitted"><FaCheckCircle /> Submitted</span>;
    }

    switch (sub.approval_status) {
      case "approved":
        return <span className="status-cell approved"><FaCheckCircle /> Approved</span>;
      case "pending":
        return <span className="status-cell pending"><FaClock /> Pending</span>;
      case "rejected":
        return <span className="status-cell rejected"><FaExclamationTriangle /> Rejected</span>;
      default:
        return <span className="status-cell missing"><FaTimesCircle /> Missing</span>;
    }
  };

  // --- FILTER ROWS ENGINE ---
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const empStatus = t.employment_status ? t.employment_status.toLowerCase().replace("-", "_") : "";
      const matchesEmp = employmentFilter === "All" || empStatus === employmentFilter.toLowerCase().replace("-", "_");
      
      const teacherSubs = Object.values(matrix[t.id] || {});
      
      let matchesStatus = true;
      if (statusFilter !== "All") {
        if (statusFilter === "Missing") {
            matchesStatus = currentColumns.some(c => !matrix[t.id][c.requirement_id] || matrix[t.id][c.requirement_id].submission_status === "missing");
        } else if (statusFilter === "Pending") {
            matchesStatus = teacherSubs.some(s => s?.approval_status === "pending");
        } else if (statusFilter === "Approved") {
            matchesStatus = teacherSubs.some(s => s?.approval_status === "approved");
        } else if (statusFilter === "Rejected") {
            matchesStatus = teacherSubs.some(s => s?.approval_status === "rejected");
        } else if (statusFilter === "Has Submissions") {
            matchesStatus = teacherSubs.some(s => s && s.submission_status === "submitted");
        } else if (statusFilter === "Fully Compliant") {
            matchesStatus = currentColumns.every(c => {
                 const s = matrix[t.id][c.requirement_id];
                 return s && (s.approval_status === "approved" || (!c.needs_approval && s.submission_status === "submitted"));
            });
        }
      }

      return matchesSearch && matchesEmp && matchesStatus;
    });
  }, [teachers, searchTerm, employmentFilter, statusFilter, matrix, currentColumns]);

  // --- ROW INTERACTION HANDLER ---
  const handleCellClick = (teacher, req) => {
    const sub = matrix[teacher.id]?.[req.requirement_id];
    // Open panel for all cells — sub may be null (shows "No Submission" state)
    setSelectedCell({ teacher, req, sub: sub || null });
    setReviewRemarks(sub?.remarks || "");
  };

  // --- POST ACTION COMPLIANCE EVALUATION ---
 const handleReviewAction = async (statusValue) => {
    if (statusValue === "rejected" && !reviewRemarks.trim()) {
      return alert("Please enter rejection remarks first.");
    }

    try {
      setActionLoading(true);
      const res = await fetch("http://localhost:5000/api/submissions/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 🔥 THE FIX: Change .submission_id to .id here
          submission_id: selectedCell.sub.id, 
          status: statusValue,
          remarks: reviewRemarks,
          admin_id: user?.id
        })
      });

      if (!res.ok) throw new Error("Could not update context state.");
      alert(`Submission marked as ${statusValue}`);
      setSelectedCell(null);
      fetchChecklistData(); 
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- EXPORT MATRIX TO EXCEL INTERFACE TEMPLATE ---
  const exportCSV = () => {
    let headers = ["Faculty Member", "Type", "Progress"];
    currentColumns.forEach(c => headers.push(c.requirement_name));
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

    filteredTeachers.forEach(t => {
      const rowCells = currentColumns.map(c => matrix[t.id][c.requirement_id]?.approval_status || matrix[t.id][c.requirement_id]?.submission_status || "missing");
      const done = rowCells.filter(s => s === "approved" || s === "submitted").length;
      const rowData = [`${t.first_name} ${t.last_name}`, t.employment_status || 'N/A', `${done}/${currentColumns.length}`, ...rowCells];
      csvContent += rowData.join(",") + "\n";
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Checklist_${activeCategory}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="loading-state-container" style={{padding: '40px', textAlign: 'center'}}>Gathering matching matrix configurations...</div>;

  return (
    <div className="checklist-container">
      {/* Structural Headers */}
      <div className="checklist-header">
        <div>
          <h2>Academic Compliance Framework Checklist</h2>
          <p>Real-time auditing of faculty submission tasks.</p>
        </div>
        <div className="header-actions">
          <select value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} className="period-select">
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="period-select">
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
          </select>
          <button className="btn-secondary" onClick={exportCSV}><FaDownload /> CSV</button>
          <button className="btn-secondary" onClick={() => window.print()}><FaPrint /> Print</button>
        </div>
      </div>

      {/* Database Categories Tabs */}
      <div className="checklist-tabs">
        <button className={`tab-btn ${activeCategory === "teacher_documents" ? "active" : ""}`} onClick={() => setActiveCategory("teacher_documents")}>Teacher Documents</button>
        <button className={`tab-btn ${activeCategory === "assessment" ? "active" : ""}`} onClick={() => setActiveCategory("assessment")}>Assessments</button>
        <button className={`tab-btn ${activeCategory === "materials" ? "active" : ""}`} onClick={() => setActiveCategory("materials")}>Course Materials</button>
      </div>

      {/* Filter Options */}
      <div className="filter-toolbar">
        <div className="search-box">
          <FaSearch />
          <input type="text" placeholder="Search teacher profile..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Audit Statuses</option>
            <option value="Missing">Has Missing Files</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Has Approved Files</option>
            <option value="Rejected">Has Rejected Files</option>
            <option value="Has Submissions">Has Made Submissions</option>
            <option value="Fully Compliant">Fully Compliant (100%)</option>
          </select>
          <select value={employmentFilter} onChange={(e) => setEmploymentFilter(e.target.value)}>
            <option value="All">All Employment Slots</option>
            <option value="Full-Time">Full-Time Only</option>
            <option value="Part-Time">Part-Time Only</option>
            <option value="Contractual">Contractual Only</option>
          </select>
        </div>
      </div>

      {/* Grid Matrix Database View Engine */}
      <div className="table-responsive">
        <table className="checklist-table">
          <thead>
            <tr>
              <th>Faculty Profile Header</th>
              <th>Progress Rate</th>
              {currentColumns.map(col => (
                <th key={col.requirement_id}>{col.requirement_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
               <tr>
                 <td colSpan={currentColumns.length + 2} style={{textAlign: 'center', padding: '30px'}}>
                   No faculty profiles match your current search and filter settings.
                 </td>
               </tr>
            ) : (
               filteredTeachers.map(teacher => {
                const approvedItemsCount = currentColumns.filter(c => {
                  const s = matrix[teacher.id]?.[c.requirement_id];
                  return s && (s.approval_status === "approved" || (!c.needs_approval && s.submission_status === "submitted"));
                }).length;

                return (
                  <tr key={teacher.id}>
                    <td className="faculty-info-cell">
                      <strong>{teacher.first_name} {teacher.last_name}</strong>
                      <span>{teacher.specialization || "General Core"} • {(teacher.employment_status || "N/A").toUpperCase()}</span>
                    </td>
                    <td>
                      <span className="progress-badge">{approvedItemsCount} / {currentColumns.length}</span>
                    </td>
                     {currentColumns.map(req => {
                      const sub = matrix[teacher.id]?.[req.requirement_id];
                      return (
                        <td
                          key={req.requirement_id}
                          className="interactive-status-cell"
                          style={{ cursor: sub ? 'pointer' : 'default' }}
                          onClick={() => handleCellClick(teacher, req)}
                        >
                          {renderStatus(sub, req.needs_approval)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Overlay Drawer Sheet Code Block */}
      {selectedCell && (
        <div className="review-side-panel-overlay" onClick={() => setSelectedCell(null)}>
          <div className="review-side-panel" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '90vw' }}> {/* Made slightly wider for reading */}
            <h3>Document Approval Review Hub</h3>
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div>
                <p><strong>Faculty:</strong> {selectedCell.teacher.first_name} {selectedCell.teacher.last_name}</p>
                <p><strong>Requirement Target:</strong> {selectedCell.req.requirement_name}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p><strong>Status:</strong> <span style={{textTransform: 'uppercase', fontWeight: 'bold'}}>
                  {selectedCell.sub
                    ? (selectedCell.sub.approval_status || selectedCell.sub.submission_status)
                    : 'MISSING'}
                </span></p>
                {selectedCell.sub && (
                  <p><strong>Date:</strong> {new Date(selectedCell.sub.created_at).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            
           {/* DOCUMENT VIEWER or NO-SUBMISSION STATE */}
            {!selectedCell.sub ? (
              // No submission yet — show placeholder
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ccc', marginBottom: '20px', color: '#999', textAlign: 'center', padding: '20px' }}>
                <FaTimesCircle style={{ fontSize: '48px', marginBottom: '12px', color: '#ddd' }} />
                <h3 style={{ margin: '0 0 8px 0', color: '#aaa' }}>No Submission Found</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>This faculty member has not submitted this requirement yet.</p>
              </div>
            ) : (
              <>
                {/* DOCUMENT VIEWER — Image: direct render | PDF: direct iframe | Word/Excel: MS Office Online */}
                <div className="document-viewer-box" style={{ width: '100%', height: '400px', backgroundColor: '#f0f0f0', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', marginBottom: '20px' }}>
                  
                  {selectedCell.sub.file_type && selectedCell.sub.file_type.includes("image") ? (
                    // 1. IMAGE — render directly
                    <img 
                      src={selectedCell.sub.file_url} 
                      alt="Submission" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />

                  ) : selectedCell.sub.file_type === "text/plain" ? (
                    // 2. DUMMY / PLAIN TEXT TEST FILES
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center', color: '#666' }}>
                      <FaEye style={{ fontSize: '48px', marginBottom: '10px', color: '#ccc' }} />
                      <h3>Testing File Detected</h3>
                      <p>This is a plain text testing document. The system successfully routed and saved it.</p>
                    </div>

                  ) : selectedCell.sub.file_type === "application/pdf" ? (
                    // 3. PDF — inline via Cloudinary image delivery (prevents auto-download)
                    <iframe
                      src={getInlinePdfUrl(selectedCell.sub.file_url)}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="PDF Preview"
                      key={selectedCell.sub.file_url}
                    ></iframe>

                  ) : (
                    // 4. WORD / EXCEL — Microsoft Office Online viewer (reliable with public URLs)
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedCell.sub.file_url)}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Office Document Preview"
                      key={selectedCell.sub.file_url}
                    ></iframe>
                  )}
                </div>

                {/* FULL SCREEN BUTTON */}
                <a 
                  href={
                    selectedCell.sub.file_type && selectedCell.sub.file_type.includes("image")
                      ? selectedCell.sub.file_url
                      : selectedCell.sub.file_type === "application/pdf"
                        ? getInlinePdfUrl(selectedCell.sub.file_url)
                        : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(selectedCell.sub.file_url)}`
                  } 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary-link" 
                  style={{display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 15px', background: '#2E7D32', color: 'white', textDecoration: 'none', borderRadius: '8px', marginBottom: '15px', width: '100%', justifyContent: 'center'}}
                >
                  <FaEye /> View Document Full Screen
                </a>
              </>
            )}


            {/* Actions Display — only shown when sub exists and is pending */}
            {selectedCell.sub && selectedCell.req.needs_approval && selectedCell.sub.approval_status === "pending" && (
              <div className="approval-form-container">
                <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>Rejection Reason Details (Required if executing rejection parameters)</label>
                <textarea 
                  value={reviewRemarks} 
                  onChange={(e) => setReviewRemarks(e.target.value)} 
                  placeholder="Type feedback reasons here..." 
                  style={{width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px'}}
                />
                <div className="split-action-row" style={{display: 'flex', gap: '10px'}}>
                  <button className="btn-approve" style={{flex: 1, padding: '12px', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}} disabled={actionLoading} onClick={() => handleReviewAction("approved")}>Approve Submission</button>
                  <button className="btn-reject" style={{flex: 1, padding: '12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}} disabled={actionLoading} onClick={() => handleReviewAction("rejected")}>Reject Submission</button>
                </div>
              </div>
            )}

            {selectedCell.sub?.approval_status === "rejected" && (
              <div className="remarks-history-box" style={{marginTop: '20px', padding: '15px', background: '#feebee', borderRadius: '8px', borderLeft: '4px solid #d32f2f'}}>
                <h4 style={{margin: '0 0 10px 0'}}>Historical Evaluation Remarks:</h4>
                <p style={{margin: 0}}>{selectedCell.sub.remarks || "No remark evaluation values specified."}</p>
              </div>
            )}

            <button className="close-panel-btn" style={{marginTop: '20px', width: '100%', padding: '12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => setSelectedCell(null)}>Dismiss Evaluation Sheet</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AChecklist;