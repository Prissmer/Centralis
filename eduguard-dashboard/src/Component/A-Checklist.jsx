import React, { useState, useEffect, useMemo } from "react";
import { 
  FaSearch, FaDownload, FaPrint, FaCheckCircle, 
  FaTimesCircle, FaClock, FaExclamationTriangle, FaLock, FaEye 
} from "react-icons/fa";
import { useAuth } from "../Context/AuthContext";
import "./Style/A-Checklist.css";

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
      
      // 🔥 ADD THIS LINE: This prints the data to your browser console
      console.log("🚀 CHECKLIST DATA FROM BACKEND:", data); 

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
      map[t.id] = {}; // CHANGED to t.id
      currentColumns.forEach(c => {
        const sub = submissions.find(
          s => s.teacher_id === t.id && s.requirement_id === c.requirement_id // CHANGED to t.id
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
        return <span className="status-cell approved"><FaCheckCircle /> Approved {sub.is_late && <span className="badge-late">Late</span>}</span>;
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
      // CHANGED: Using first_name and last_name
      const matchesSearch = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      const empStatus = t.employment_status ? t.employment_status.toLowerCase().replace("-", "_") : "";
      const matchesEmp = employmentFilter === "All" || empStatus === employmentFilter.toLowerCase().replace("-", "_");
      
      const teacherSubs = Object.values(matrix[t.id] || {}); // CHANGED to t.id
      
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
    const sub = matrix[teacher.id][req.requirement_id]; // CHANGED to t.id
    if (!sub) return; 
    setSelectedCell({ teacher, req, sub });
    setReviewRemarks(sub.remarks || "");
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
          submission_id: selectedCell.sub.submission_id,
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

  if (loading) return <div className="loading-state-container">Gathering matching matrix configurations...</div>;

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
            {filteredTeachers.map(teacher => {
              
              // 🔥 THE FIX: We calculate the approved count safely by mapping through currentColumns directly
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
                      <td key={req.requirement_id} className="interactive-status-cell" onClick={() => handleCellClick(teacher, req)}>
                        {renderStatus(sub, req.needs_approval)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overlay Drawer Sheet Code Block */}
      {selectedCell && (
        <div className="review-side-panel-overlay" onClick={() => setSelectedCell(null)}>
          <div className="review-side-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Document Approval Review Hub</h3>
            <hr />
            <p><strong>Faculty:</strong> {selectedCell.teacher.first_name} {selectedCell.teacher.last_name}</p>
            <p><strong>Requirement Target:</strong> {selectedCell.req.requirement_name}</p>
            <p><strong>Current State:</strong> <span style={{textTransform: 'uppercase'}}>{selectedCell.sub.approval_status || selectedCell.sub.submission_status}</span></p>
            <p><strong>Submitted Date:</strong> {new Date(selectedCell.sub.uploaded_at).toLocaleString()}</p>
            
            <a href={selectedCell.sub.file_url} target="_blank" rel="noreferrer" className="btn-primary-link"><FaEye /> Open Document Stream</a>

            {/* Actions Display */}
            {selectedCell.req.needs_approval && selectedCell.sub.approval_status === "pending" && (
              <div className="approval-form-container">
                <label>Rejection Reason Details (Required if executing rejection parameters)</label>
                <textarea value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} placeholder="Type feedback reasons here..." />
                <div className="split-action-row">
                  <button className="btn-approve" disabled={actionLoading} onClick={() => handleReviewAction("approved")}>Approve</button>
                  <button className="btn-reject" disabled={actionLoading} onClick={() => handleReviewAction("rejected")}>Reject</button>
                </div>
              </div>
            )}

            {selectedCell.sub.approval_status === "rejected" && (
              <div className="remarks-history-box">
                <h4>Historical Evaluation Remarks:</h4>
                <p>{selectedCell.sub.remarks || "No remark evaluation values specified."}</p>
              </div>
            )}

            <button className="close-panel-btn" onClick={() => setSelectedCell(null)}>Dismiss Evaluation Sheet</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AChecklist;