import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaTrash, FaEdit, FaRegBell, FaTimes, FaCalendarAlt, FaClock, FaCheckSquare } from "react-icons/fa";
import "./Style/A-Requirement.css"; 

const RequirementsPage = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 🔥 NEW: Tab State & Selection State
  const [activeTab, setActiveTab] = useState("materials"); 
  const [selectedReqs, setSelectedReqs] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  
  const [newReq, setNewReq] = useState({
    requirement_name: "", category: "materials", needs_approval: true, semester_based: true
  });

  const [bulkDeadline, setBulkDeadline] = useState({
    due_date: "", grace_period_hours: 0, auto_reminders: true
  });

  const limit = 10;

  // Fetch when Tab, Page, or Search changes
  useEffect(() => {
    fetchRequirements();
    setSelectedReqs([]); // Clear selections when changing tabs or pages
  }, [currentPage, searchTerm, activeTab]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/requirements?page=${currentPage}&limit=${limit}&search=${searchTerm}&category=${activeTab}`
      );
      const result = await res.json();
      setRequirements(result.data || []);
      setTotalItems(result.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // --- ROW SELECTION LOGIC ---
  const handleSelectRow = (id) => {
    setSelectedReqs(prev => 
      prev.includes(id) ? prev.filter(reqId => reqId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReqs(requirements.map(req => req.requirement_id));
    } else {
      setSelectedReqs([]);
    }
  };

  // --- ACTIONS ---
  const handleAddRequirement = async () => {
    try {
      const res = await fetch("http://localhost:5000/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({...newReq, category: activeTab}), // Auto-assign to current tab
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewReq({ requirement_name: "", category: "materials", needs_approval: true, semester_based: true });
        setCurrentPage(1);
        fetchRequirements();
      }
    } catch (err) { alert("Failed to add record"); }
  };

 const handleSaveBulkDeadlines = async () => {
    try {
      const res = await fetch("http://localhost:5000/requirements/bulk-deadline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement_ids: selectedReqs, 
          category: activeTab, // 🔥 NEW: Tell the backend which tab we are on!
          due_date: bulkDeadline.due_date,
          grace_period_hours: bulkDeadline.grace_period_hours,
          auto_reminders: bulkDeadline.auto_reminders
        })
      });

      if (res.ok) {
        alert(`Successfully applied deadlines to ${selectedReqs.length} requirements!`);
        setShowDeadlineModal(false); 
        setSelectedReqs([]); 
        fetchRequirements(); 
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }
    } catch (err) { 
      console.error(err);
      alert("Failed to save deadlines."); 
    }
  };
  
  const totalPages = Math.ceil(totalItems / limit);
  const isAllSelected = requirements.length > 0 && selectedReqs.length === requirements.length;

  return (
    <div className="req-management-wrapper">
      <div className="req-view-header">
        <h2>System Requirements</h2>
        <div className="req-header-tools">
          <div className="req-search-box">
            <FaSearch className="req-icon-gray" />
            <input type="text" placeholder="Quick search..." />
          </div>
          <div className="req-notification-trigger">
            <FaRegBell /><span className="req-dot-indicator"></span>
          </div>
        </div>
      </div>

      {/* 🔥 NEW: Categories per Tab UI */}
      <div className="req-tabs-container">
        <button className={`req-tab-btn ${activeTab === "materials" ? "active" : ""}`} onClick={() => {setActiveTab("materials"); setCurrentPage(1);}}>
          Course Materials
        </button>
        <button className={`req-tab-btn ${activeTab === "assessment" ? "active" : ""}`} onClick={() => {setActiveTab("assessment"); setCurrentPage(1);}}>
          Assessments
        </button>
        <button className={`req-tab-btn ${activeTab === "teacher_documents" ? "active" : ""}`} onClick={() => {setActiveTab("teacher_documents"); setCurrentPage(1);}}>
          Teacher Documents
        </button>
      </div>

      <div className="req-card-view">
        <div className="req-toolbar">
          <div className="req-input-group">
            <FaSearch className="req-icon-gray" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab.replace("_", " ")}...`} 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          
          <div className="req-action-group">
            {/* 🔥 NEW: Show Set Deadline button ONLY if items are selected */}
            {selectedReqs.length > 0 && (
              <button className="req-btn-deadline" onClick={() => setShowDeadlineModal(true)}>
                <FaCalendarAlt /> Set Timeline ({selectedReqs.length})
              </button>
            )}

            <button className="req-btn-primary" onClick={() => setShowAddModal(true)}>
              <FaPlus /> Add Requirement
            </button>
          </div>
        </div>

        <div className="req-table-responsive">
          <table className="req-data-table">
            <thead>
              <tr>
                {/* Master Checkbox */}
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input type="checkbox" className="req-row-checkbox" checked={isAllSelected} onChange={handleSelectAll} />
                </th>
                <th>ID</th>
                <th>Requirement Name</th>
                <th>Deadline</th>
                <th>Grace Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>Loading data...</td></tr>
              ) : requirements.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>No requirements found in this category.</td></tr>
              ) : (
                requirements.map((req) => {
                  const isSelected = selectedReqs.includes(req.requirement_id);
                  const isOverdue = req.due_date && new Date(req.due_date) < new Date();
                  
                  return (
                    <tr key={req.requirement_id} className={`${isOverdue ? "req-row-overdue" : ""} ${isSelected ? "req-row-selected" : ""}`}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          className="req-row-checkbox"
                          checked={isSelected} 
                          onChange={() => handleSelectRow(req.requirement_id)} 
                        />
                      </td>
                      <td className="req-text-light">#{req.requirement_id}</td>
                      <td className="req-font-bold">{req.requirement_name}</td>
                      <td className={isOverdue ? "req-text-danger" : "req-text-light"}>
                        {req.due_date ? new Date(req.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "Not Set"}
                        {isOverdue && <span className="req-overdue-tag">Overdue</span>}
                      </td>
                      <td className="req-text-light">{req.grace_period_hours || 0} hrs</td>
                      <td><label className="req-toggle"><input type="checkbox" checked={req.active} readOnly /><span className="req-toggle-slider"></span></label></td>
                      <td><div className="req-btn-stack"><FaEdit className="req-edit-btn" /><FaTrash className="req-delete-btn" /></div></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination logic remains identical */}
        <div className="req-pagination-row">
          <div className="req-page-info">Showing {requirements.length} of {totalItems} entries</div>
          <div className="req-pager">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i+1} className={`req-pager-btn ${currentPage === i+1 ? "is-active" : ""}`} onClick={() => setCurrentPage(i+1)}>{i+1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL 1: ADD NEW REQUIREMENT
      ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="req-overlay">
          <div className="req-modal-container">
            <div className="req-modal-header">
              <div className="req-modal-title"><h3>Add {activeTab.replace("_", " ")}</h3><p>Configure a new academic item.</p></div>
              <FaTimes className="req-modal-close" onClick={() => setShowAddModal(false)} />
            </div>
            <div className="req-form-box">
              <div className="req-form-field">
                <label className="req-form-label">Requirement Name</label>
                <input className="req-modal-input" type="text" placeholder="e.g. Midterm TOS" value={newReq.requirement_name} onChange={(e) => setNewReq({...newReq, requirement_name: e.target.value})} />
              </div>
              <div className="req-checkbox-grid">
                <div className="req-check-item">
                  <input type="checkbox" id="na" checked={newReq.needs_approval} onChange={(e) => setNewReq({...newReq, needs_approval: e.target.checked})} />
                  <label htmlFor="na">Needs Approval</label>
                </div>
                <div className="req-check-item">
                  <input type="checkbox" id="sb" checked={newReq.semester_based} onChange={(e) => setNewReq({...newReq, semester_based: e.target.checked})} />
                  <label htmlFor="sb">Semester Based</label>
                </div>
              </div>
            </div>
            <div className="req-modal-footer">
              <button className="req-btn-save" onClick={handleAddRequirement}>Create Record</button>
              <button className="req-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 2: BULK DEADLINE CUSTOMIZATION
      ------------------------------------------------------------- */}
      {showDeadlineModal && (
        <div className="req-overlay">
          <div className="req-modal-container" style={{ maxWidth: '550px' }}>
            <div className="req-modal-header">
              <div className="req-modal-title">
                <h3>Set Timeline Targets</h3>
                <p>Applying to <strong style={{color: '#14532d'}}>{selectedReqs.length}</strong> selected requirements.</p>
              </div>
              <FaTimes className="req-modal-close" onClick={() => setShowDeadlineModal(false)} />
            </div>
            <div className="req-form-box">
              <div className="req-grid-2col">
                <div className="req-form-field">
                  <label className="req-form-label">Target Deadline (Date & Time)</label>
                  <input 
                    className="req-modal-input" 
                    type="datetime-local" 
                    value={bulkDeadline.due_date} 
                    onChange={(e) => setBulkDeadline({...bulkDeadline, due_date: e.target.value})} 
                  />
                </div>
                <div className="req-form-field">
                  <label className="req-form-label">Grace Period (Hours)</label>
                  <input 
                    className="req-modal-input" 
                    type="number" min="0" placeholder="0" 
                    value={bulkDeadline.grace_period_hours} 
                    onChange={(e) => setBulkDeadline({...bulkDeadline, grace_period_hours: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="req-check-item" style={{ marginTop: '15px', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  id="bulk-remind" 
                  checked={bulkDeadline.auto_reminders} 
                  onChange={(e) => setBulkDeadline({...bulkDeadline, auto_reminders: e.target.checked})} 
                />
                <label htmlFor="bulk-remind"><FaClock style={{marginRight: '5px', color: '#64748b'}}/> Enable 24h Auto-Reminders for missing submissions</label>
              </div>
            </div>
            <div className="req-modal-footer">
              <button className="req-btn-save" onClick={handleSaveBulkDeadlines}>Apply Deadlines</button>
              <button className="req-btn-cancel" onClick={() => setShowDeadlineModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RequirementsPage;