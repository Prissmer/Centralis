import React, { useState, useEffect, useMemo } from "react";
import { 
  FaSearch, FaDownload, FaPrint, FaCheckCircle, 
  FaTimesCircle, FaClock, FaExclamationTriangle, FaLock, FaEye,
  FaChevronLeft, FaChevronRight 
} from "react-icons/fa";
import { useAuth } from "../Context/AuthContext";
import "./Style/A-Checklist.css";

// Helper: Cloudinary serves PDFs uploaded via /auto/ as 'raw' (Content-Disposition: attachment = auto-download).
// Route through our backend proxy which re-serves with Content-Disposition: inline.
const getInlinePdfUrl = (url) => {
  if (!url) return url;
  return `${import.meta.env.VITE_API_URL}/api/proxy-pdf?url=${encodeURIComponent(url)}`;
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

  // Assign Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignReq, setAssignReq] = useState(null);
  const [assignRoles, setAssignRoles] = useState([]);
  const [assignUsers, setAssignUsers] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);

  // Pagination state
  const [checklistPage, setChecklistPage] = useState(1);
  const checklistLimit = 10;

  // --- GET RELEVANT BACKEND AGGREGATIONS ---
  const fetchChecklistData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/compliance-checklist?semester=${semester}&school_year=${schoolYear}`
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

  const openAssignModal = (req, e) => {
    e.stopPropagation();
    setAssignReq(req);
    setAssignRoles(req.assigned_roles || ['instructor', 'lead_instructor']);
    setAssignUsers(req.assigned_users || []);
    setShowAssignModal(true);
  };

  const saveAssignments = async () => {
    try {
      setAssignSaving(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/requirements/${assignReq.requirement_id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_roles: assignRoles, assigned_users: assignUsers })
      });
      if(res.ok) {
        setShowAssignModal(false);
        fetchChecklistData();
      }
    } catch(err) {
      console.error(err);
    } finally {
      setAssignSaving(false);
    }
  };

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
        return <span className="status-cell approved"><FaCheckCircle /> Acknowledged</span>;
      case "pending":
        return <span className="status-cell pending"><FaClock /> Review</span>;
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
    try {
      setActionLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/submissions/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: selectedCell.sub.id, 
          status: statusValue,
          remarks: reviewRemarks,
          admin_id: user?.id
        })
      });

      if (!res.ok) throw new Error("Could not update context state.");
      alert(`Submission acknowledged successfully.`);
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
      <header className="responsive-header">
        <div className="header-left">
          <h2 style={{
            fontSize: '28px', fontWeight: 700,
            background: 'linear-gradient(135deg, #166534, #14532d)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent', margin: 0
          }}>Compliance Checklist</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Real-time auditing of faculty submission tasks.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} className="period-select" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
          </select>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="period-select" style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
          </select>
          <button className="btn-secondary" onClick={exportCSV} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}><FaDownload /> CSV</button>
          <button className="btn-secondary" onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}><FaPrint /> Print</button>
        </div>
      </header>

      <div style={{ marginTop: '90px' }}>

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
              <th style={{ width: '250px' }}>Faculty Member</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Progress</th>
              {currentColumns.map(col => (
                <th key={col.requirement_id}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <span>{col.requirement_name}</span>
                    <button className="btn-secondary" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={(e) => openAssignModal(col, e)}>Assign</button>
                  </div>
                </th>
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
               (() => {
                 const startIdx = (checklistPage - 1) * checklistLimit;
                 const paginatedTeachers = filteredTeachers.slice(startIdx, startIdx + checklistLimit);
                 return paginatedTeachers.map(teacher => {
                 const assignedColumns = currentColumns.filter(c => {
                   const isRoleAssigned = !c.assigned_roles || c.assigned_roles.length === 0 || c.assigned_roles.includes(teacher.role);
                   const isUserAssigned = c.assigned_users && c.assigned_users.includes(teacher.id);
                   return isRoleAssigned || isUserAssigned;
                 });

                 const approvedItemsCount = assignedColumns.filter(c => {
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
                      <span className="progress-badge">{approvedItemsCount} / {assignedColumns.length}</span>
                    </td>
                     {currentColumns.map(req => {
                      const isRoleAssigned = !req.assigned_roles || req.assigned_roles.length === 0 || req.assigned_roles.includes(teacher.role);
                      const isUserAssigned = req.assigned_users && req.assigned_users.includes(teacher.id);
                      const isAssigned = isRoleAssigned || isUserAssigned;

                      const sub = matrix[teacher.id]?.[req.requirement_id];

                      if (!isAssigned) {
                        return <td key={req.requirement_id} style={{ backgroundColor: '#f8fafc', color: '#94a3b8', textAlign: 'center', fontSize: '12px' }}>Not Assigned</td>;
                      }

                      return (
                        <td
                          key={req.requirement_id}
                          className="interactive-status-cell"
                          onClick={() => handleCellClick(teacher, req)}
                        >
                          {renderStatus(sub, req.needs_approval)}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
              })()
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredTeachers.length > checklistLimit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'white', borderRadius: '0 0 16px 16px', borderTop: '1px solid #f0f2f5' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {Math.min(checklistLimit, filteredTeachers.length - (checklistPage - 1) * checklistLimit)} of {filteredTeachers.length} faculty</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setChecklistPage(p => Math.max(1, p - 1))} disabled={checklistPage <= 1}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: checklistPage <= 1 ? '#f1f5f9' : 'white', cursor: checklistPage <= 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              <FaChevronLeft />
            </button>
            <span style={{ fontSize: '13px', color: '#475569', padding: '0 8px' }}>Page {checklistPage} of {Math.ceil(filteredTeachers.length / checklistLimit)}</span>
            <button onClick={() => setChecklistPage(p => Math.min(Math.ceil(filteredTeachers.length / checklistLimit), p + 1))} disabled={checklistPage >= Math.ceil(filteredTeachers.length / checklistLimit)}
              style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: checklistPage >= Math.ceil(filteredTeachers.length / checklistLimit) ? '#f1f5f9' : 'white', cursor: checklistPage >= Math.ceil(filteredTeachers.length / checklistLimit) ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {selectedCell && (
        <div className="review-side-panel-overlay" onClick={() => setSelectedCell(null)}>
          <div className="review-side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="review-panel-header">
              <h3>Document Review</h3>
              <button className="review-panel-close-icon" onClick={() => setSelectedCell(null)}><FaTimesCircle /></button>
            </div>
            
            <div className="review-meta-card">
              <div className="meta-col">
                <span className="meta-label">Faculty</span>
                <span className="meta-value">{selectedCell.teacher.first_name} {selectedCell.teacher.last_name}</span>
              </div>
              <div className="meta-col">
                <span className="meta-label">Requirement Target</span>
                <span className="meta-value">{selectedCell.req.requirement_name}</span>
              </div>
              {selectedCell.req.needs_approval && (
                <div className="meta-col" style={{ textAlign: 'right' }}>
                  <span className="meta-label">Status</span>
                  <span className={`meta-status-badge ${selectedCell.sub ? (selectedCell.sub.approval_status || selectedCell.sub.submission_status) : 'missing'}`}>
                    {selectedCell.sub ? 
                      ((selectedCell.sub.approval_status || selectedCell.sub.submission_status).toUpperCase() === 'APPROVED' 
                        ? 'ACKNOWLEDGED' 
                        : (selectedCell.sub.approval_status || selectedCell.sub.submission_status).toUpperCase()
                      ) : 'MISSING'}
                  </span>
                </div>
              )}
            </div>
            
           {/* DOCUMENT VIEWER or NO-SUBMISSION STATE */}
            {!selectedCell.sub ? (
              // No submission yet — show placeholder
              <div className="review-empty-state">
                <FaExclamationTriangle className="empty-state-icon" />
                <h4>No Submission Found</h4>
                <p>This faculty member has not submitted this requirement yet.</p>
              </div>
            ) : (
              <>
                {/* DOCUMENT VIEWER */}
                <div className="document-viewer-box">
                  
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
                  className="btn-primary-link review-fullscreen-btn" 
                >
                  <FaEye /> View Document Full Screen
                </a>
              </>
            )}

            {/* Actions Display — only shown when sub exists and is pending */}
            {selectedCell.sub && selectedCell.req.needs_approval && selectedCell.sub.approval_status === "pending" && (
              <div className="approval-form-container">
                <button className="btn-approve" disabled={actionLoading} onClick={() => handleReviewAction("approved")}>
                  Acknowledge Submission
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGN REQUIREMENT MODAL */}
      {showAssignModal && assignReq && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '15px' }}>Assign "{assignReq.requirement_name}"</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Assign by Role</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={assignRoles.includes("instructor")}
                  onChange={(e) => {
                    setAssignRoles(prev => e.target.checked ? [...prev, "instructor"] : prev.filter(r => r !== "instructor"));
                  }} 
                />
                Instructor
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={assignRoles.includes("lead_instructor")}
                  onChange={(e) => {
                    setAssignRoles(prev => e.target.checked ? [...prev, "lead_instructor"] : prev.filter(r => r !== "lead_instructor"));
                  }} 
                />
                Lead Instructor
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Assign to Specific Users</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                {teachers.map(t => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '4px' }}>
                    <input 
                      type="checkbox" 
                      checked={assignUsers.includes(t.id) || assignRoles.includes(t.role)}
                      disabled={assignRoles.includes(t.role)}
                      onChange={(e) => {
                        setAssignUsers(prev => e.target.checked ? [...prev, t.id] : prev.filter(id => id !== t.id));
                      }} 
                    />
                    {t.first_name} {t.last_name} <span style={{ fontSize: '12px', color: '#94a3b8' }}>({t.role === 'lead_instructor' ? 'Lead' : 'Instructor'})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)} disabled={assignSaving}>Cancel</button>
              <button className="btn-primary" onClick={saveAssignments} disabled={assignSaving}>{assignSaving ? "Saving..." : "Save Assignments"}</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AChecklist;