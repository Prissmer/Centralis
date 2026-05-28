import React, { useState, useEffect } from 'react';
import "./Style/F-Materials.css"; // Points to the unique layout css stylesheet
import { FaSearch, FaFilePdf, FaDownload, FaFilter } from 'react-icons/fa';

const Materials = () => {
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

  // Fetch Data based on Active Tab
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "8",
        search: searchTerm,
        subject: subjectFilter,
        date: dateFilter,
        category: activeTab // Sends the current activeTab string directly to the backend API query
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

  return (
    <div className="acad-res-viewport-container">
      <div className="acad-res-layout-shell">
        
        {/* HEADER AREA */}
        <header className="acad-res-sticky-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h2>Academic Resources</h2>
              <p style={{ margin: '4px 0 0 0' }}>Manage and monitor uploaded faculty {activeTab === "materials" ? "materials" : "assessments"}</p>
            </div>
          </div>
        </header>

        {/* TABS NAVIGATION */}
        <div className="acad-res-tabs-bar">
          <button 
            className={`acad-res-toggle-tab ${activeTab === "materials" ? "is-active" : ""}`} 
            onClick={() => { setActiveTab("materials"); setPage(1); }}
          >
            Materials
          </button>
          <button 
            className={`acad-res-toggle-tab ${activeTab === "assessment" ? "is-active" : ""}`} 
            onClick={() => { setActiveTab("assessment"); setPage(1); }}
          >
            Assessments
          </button>
        </div>

        {/* CONTROL TOOLBAR PANEL */}
        <div className="acad-res-content-area">
          <div className="acad-res-main-card">
            
            <div className="acad-res-toolbar">
              <div className="acad-res-search-box">
                <FaSearch />
                <input 
                  type="text" 
                  placeholder="Search by filename..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
              
              <div className="acad-res-menu-anchor" style={{ display: 'flex', gap: '16px', minWidth: 'auto', flex: '1' }}>
                <div className="acad-res-search-box" style={{ flex: '1' }}>
                  <FaFilter style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder="Filter by Subject..." 
                    value={subjectFilter}
                    style={{ paddingLeft: '46px' }}
                    onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="acad-res-search-box" style={{ flex: '1' }}>
                  <input 
                    type="date" 
                    value={dateFilter}
                    style={{ paddingLeft: '16px' }}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
            </div>

            {/* RESPONSIVE SCROLL WINDOW CARD */}
            <div className="acad-res-table-scroller">
              <table className="acad-res-data-table">
                <thead>
                  <tr>
                    <th>FILE DETAILS</th>
                    <th>SUBJECT</th>
                    <th>UPLOADED BY</th>
                    <th>UPLOAD DATE</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 0' }}>Loading data...</td></tr>
                  ) : materials.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 0' }}>No {activeTab} found.</td></tr>
                  ) : (
                    materials.map((item, index) => (
                      <tr key={item.submission_id || item.id || index}>
                        <td>
                          <div className="acad-res-file-cell">
                            <div style={{ background: '#fef2f2', color: '#ef4444', padding: '8px', borderRadius: '8px', display: 'flex' }}><FaFilePdf /></div>
                            <div>
                              <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{item.title || item.file_name}</p>
                              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{item.document_type}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="acad-res-subject-tag">{item.subject || "N/A"}</span></td>
                        <td style={{ color: '#475569', fontWeight: '500' }}>Instructor</td>
                        <td>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <a href={item.file_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#166534', fontWeight: '600', fontSize: '14px', alignSelf: 'center', paddingRight: '8px' }}>View</a>
                            <a href={item.file_url} download target="_blank" rel="noreferrer" className="acad-res-btn-download" style={{ padding: '8px 12px' }}>
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

            {/* PAGINATION PANEL FOOTER */}
            {!loading && totalPages > 1 && (
              <div className="acad-res-paginator">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="acad-res-page-btn">Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="acad-res-page-btn">Next</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Materials;