import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaTrash, FaEdit, FaRegBell, FaTimes } from "react-icons/fa";
import "./Style/A-Requirement.css"; 

const RequirementsPage = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  const [newReq, setNewReq] = useState({
    requirement_name: "",
    category: "materials",
    needs_approval: true,
    semester_based: true
  });

  const limit = 10;

  useEffect(() => {
    fetchRequirements();
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchRequirements = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/requirements?page=${currentPage}&limit=${limit}&search=${searchTerm}&category=${categoryFilter}`
      );
      const result = await res.json();
      setRequirements(result.data || []);
      setTotalItems(result.total || 0);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleAddRequirement = async () => {
    try {
      const res = await fetch("http://localhost:5000/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReq),
      });
      if (res.ok) {
        setShowModal(false);
        setNewReq({ requirement_name: "", category: "materials", needs_approval: true, semester_based: true });
        setCurrentPage(1);
        fetchRequirements();
      }
    } catch (err) { alert("Failed to add record"); }
  };

  const totalPages = Math.ceil(totalItems / limit);

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

      <div className="req-card-view">
        <div className="req-toolbar">
          <div className="req-input-group">
            <FaSearch className="req-icon-gray" />
            <input 
              type="text" 
              placeholder="Filter by name..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
            />
          </div>
          <div className="req-action-group">
            <select className="req-dropdown" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Categories</option>
              <option value="materials">Materials</option>
              <option value="assessment">Assessment</option>
              <option value="teacher_documents">Teacher Documents</option>
            </select>
            <button className="req-btn-primary" onClick={() => setShowModal(true)}>
              <FaPlus /> Add Requirement
            </button>
          </div>
        </div>

        <div className="req-table-responsive">
          <table className="req-data-table">
            <thead>
              <tr>
                <th>ID</th><th>Requirement Name</th><th>Category</th><th>Approval</th><th>Semester</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>Loading data...</td></tr>
              ) : (
                requirements.map((req) => (
                  <tr key={req.requirement_id}>
                    <td className="req-text-light">#{req.requirement_id}</td>
                    <td className="req-font-bold">{req.requirement_name}</td>
                    <td>
                      <span className={`req-pill-badge cat-${req.category}`}>
                        {req.category.replace("_", " ")}
                      </span>
                    </td>
                    <td>{req.needs_approval ? "Yes" : "No"}</td>
                    <td>{req.semester_based ? "Yes" : "No"}</td>
                    <td><label className="req-toggle"><input type="checkbox" checked={req.active} readOnly /><span className="req-toggle-slider"></span></label></td>
                    <td><div className="req-btn-stack"><FaEdit className="req-edit-btn" /><FaTrash className="req-delete-btn" /></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="req-pagination-row">
          <div className="req-page-info">Showing {requirements.length} of {totalItems} entries</div>
          <div className="req-pager">
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i+1} 
                className={`req-pager-btn ${currentPage === i+1 ? "is-active" : ""}`} 
                onClick={() => setCurrentPage(i+1)}
              >
                {i+1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="req-overlay">
          <div className="req-modal-container">
            <div className="req-modal-header">
              <div className="req-modal-title"><h3>Add New Requirement</h3><p>Configure a new academic item.</p></div>
              <FaTimes className="req-modal-close" onClick={() => setShowModal(false)} />
            </div>
            <div className="req-form-box">
              <div className="req-form-field">
                <label className="req-form-label">Requirement Name</label>
                <input className="req-modal-input" type="text" placeholder="e.g. Midterm TOS" value={newReq.requirement_name} onChange={(e) => setNewReq({...newReq, requirement_name: e.target.value})} />
              </div>
              <div className="req-form-field">
                <label className="req-form-label">Category</label>
                <select className="req-modal-input" value={newReq.category} onChange={(e) => setNewReq({...newReq, category: e.target.value})}>
                  <option value="materials">Materials</option>
                  <option value="assessment">Assessment</option>
                  <option value="teacher_documents">Teacher Documents</option>
                </select>
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
              <button className="req-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsPage;