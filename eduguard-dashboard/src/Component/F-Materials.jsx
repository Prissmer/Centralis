import React, { useState, useEffect } from 'react';
import "./Style/F-Materials.css";
import { FaSearch, FaFilePdf, FaDownload, FaFilter, FaEye, FaCloudUploadAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaTimes, FaFileAlt, FaFilePowerpoint, FaFileWord, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../Context/AuthContext';
import { supabase } from '../lib/supabase';

const Materials = () => {
  const { user } = useAuth();

  // Shared state
  const [activeView, setActiveView] = useState("browse"); // "browse" or "my-uploads"
  const [loading, setLoading] = useState(true);

  // === BROWSE MATERIALS STATE ===
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState("materials");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // === MY UPLOADS STATE ===
  const [myUploads, setMyUploads] = useState([]);
  const [uploadSearch, setUploadSearch] = useState("");
  const [uploadStatusFilter, setUploadStatusFilter] = useState("all");
  const [uploadPage, setUploadPage] = useState(1);
  const uploadLimit = 10;

  // === VIEW MODAL STATE ===
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  // ── FETCH BROWSE MATERIALS ──
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: searchTerm,
        subject: subjectFilter,
        date: dateFilter,
        category: activeTab,
        year_level: yearLevelFilter,
        semester: semesterFilter
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials?${queryParams}`);
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

  // ── FETCH MY UPLOADS ──
  const fetchMyUploads = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('uploaded_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyUploads(data || []);
    } catch (err) {
      console.error("Failed to fetch uploads:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === "browse") fetchMaterials();
  }, [page, searchTerm, subjectFilter, dateFilter, activeTab, activeView, yearLevelFilter, semesterFilter]);

  useEffect(() => {
    if (activeView === "my-uploads") fetchMyUploads();
  }, [activeView, user]);

  // ── DOWNLOAD HANDLER (with tracking) ──
  const handleDownload = async (e, item) => {
    e.preventDefault();
    const fileUrl = item.file_url;
    const fileName = item.title || item.file_name;
    if (!fileUrl) return;
    try {
      // Track download in Supabase
      if (user) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/downloads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            submission_id: item.id || item.submission_id,
            file_name: fileName,
            file_url: fileUrl,
            subject: item.subject || 'N/A',
            file_type: item.file_type || item.document_type,
            file_size: item.file_size || 0
          })
        });
      }

      // Trigger actual download
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = localUrl;
      link.setAttribute('download', fileName || 'academic-file.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(localUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(fileUrl, '_blank');
    }
  };

  // ── VIEW MODAL ──
  const openViewModal = (item) => {
    setViewItem(item);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewItem(null);
  };

  // ── HELPERS ──
  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return { icon: <FaCheckCircle />, text: 'Approved', cls: 'acad-status-approved' };
      case 'pending': return { icon: <FaClock />, text: 'Pending', cls: 'acad-status-pending' };
      case 'rejected': return { icon: <FaExclamationTriangle />, text: 'Rejected', cls: 'acad-status-rejected' };
      default: return { icon: <FaClock />, text: status || 'Submitted', cls: 'acad-status-pending' };
    }
  };

  const getFileIcon = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('pdf')) return <FaFilePdf style={{ color: '#ef4444' }} />;
    if (t.includes('word') || t.includes('doc')) return <FaFileWord style={{ color: '#3b82f6' }} />;
    if (t.includes('powerpoint') || t.includes('ppt') || t.includes('presentation')) return <FaFilePowerpoint style={{ color: '#f97316' }} />;
    return <FaFileAlt style={{ color: '#64748b' }} />;
  };

  const filteredUploads = myUploads.filter(u => {
    const matchesStatus = uploadStatusFilter === "all" || u.approval_status === uploadStatusFilter;
    const matchesSearch = (u.title || '').toLowerCase().includes(uploadSearch.toLowerCase()) ||
      (u.subject || '').toLowerCase().includes(uploadSearch.toLowerCase()) ||
      (u.document_type || '').toLowerCase().includes(uploadSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const uploadStats = {
    total: myUploads.length,
    approved: myUploads.filter(u => u.approval_status === 'approved').length,
    pending: myUploads.filter(u => u.approval_status === 'pending').length,
  };

  return (
    <div className="acad-res-viewport-container">
      <div className="acad-res-layout-shell">

        {/* HEADER */}
        <header className="acad-res-sticky-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h2>{activeView === "browse" ? "Academic Resources" : "My Uploads"}</h2>
              <p style={{ margin: '4px 0 0 0' }}>
                {activeView === "browse"
                  ? `Browse and download faculty ${activeTab === "materials" ? "materials" : "assessments"}`
                  : "Track and manage your submitted materials"}
              </p>
            </div>
          </div>
        </header>

        {/* VIEW SWITCHER + TABS */}
        <div className="acad-res-tabs-bar">
          <button
            className={`acad-res-toggle-tab ${activeView === "browse" ? "is-active" : ""}`}
            onClick={() => { setActiveView("browse"); setPage(1); }}
          >
            Browse Resources
          </button>
          <button
            className={`acad-res-toggle-tab ${activeView === "my-uploads" ? "is-active" : ""}`}
            onClick={() => setActiveView("my-uploads")}
          >
            <FaCloudUploadAlt style={{ marginRight: '6px' }} /> My Uploads
          </button>

          {activeView === "browse" && (
            <>
              <div style={{ width: '1px', background: '#cbd5e1', margin: '0 4px' }} />
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
            </>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="acad-res-content-area">
          <div className="acad-res-main-card">

            {/* ═══ BROWSE VIEW ═══ */}
            {activeView === "browse" && (
              <>
                <div className="acad-res-toolbar">
                  <div className="acad-res-search-box">
                    <FaSearch />
                    <input type="text" placeholder="Search by filename..." value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} />
                  </div>
                  <div className="acad-res-menu-anchor" style={{ display: 'flex', gap: '16px', minWidth: 'auto', flex: '1' }}>
                    <div className="acad-res-search-box" style={{ flex: '1' }}>
                      <select 
                        value={yearLevelFilter} 
                        onChange={(e) => { setYearLevelFilter(e.target.value); setPage(1); }}
                        style={{ paddingLeft: '16px', border: 'none', background: 'transparent', outline: 'none', width: '100%', color: '#475569' }}
                      >
                        <option value="">All Year Levels</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div className="acad-res-search-box" style={{ flex: '1' }}>
                      <select 
                        value={semesterFilter} 
                        onChange={(e) => { setSemesterFilter(e.target.value); setPage(1); }}
                        style={{ paddingLeft: '16px', border: 'none', background: 'transparent', outline: 'none', width: '100%', color: '#475569' }}
                      >
                        <option value="">All Semesters</option>
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                      </select>
                    </div>
                    <div className="acad-res-search-box" style={{ flex: '1' }}>
                      <FaFilter style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input type="text" placeholder="Filter by Subject..." value={subjectFilter}
                        style={{ paddingLeft: '46px' }}
                        onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }} />
                    </div>
                    <div className="acad-res-search-box" style={{ flex: '1' }}>
                      <input type="date" value={dateFilter} style={{ paddingLeft: '16px' }}
                        onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} />
                    </div>
                  </div>
                </div>

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
                      ) : (() => {
                        const filteredMaterials = materials.filter(item => {
                          const matchYear = !yearLevelFilter || item.year_level === yearLevelFilter || item.academic_year === yearLevelFilter || item.school_year === yearLevelFilter;
                          const matchSemester = !semesterFilter || item.semester === semesterFilter;
                          return matchYear && matchSemester;
                        });

                        if (filteredMaterials.length === 0) {
                          return <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 0' }}>No items match your selected filters.</td></tr>;
                        }

                        return filteredMaterials.map((item, index) => (
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
                            <td style={{ color: '#475569', fontWeight: '500' }}>{item.uploader_name || 'Unknown'}</td>
                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <a href={item.file_url} target="_blank" rel="noreferrer"
                                  style={{ textDecoration: 'none', color: '#166534', fontWeight: '600', fontSize: '14px', paddingRight: '8px' }}>View</a>
                                <button onClick={(e) => handleDownload(e, item)}
                                  className="acad-res-btn-download"
                                  style={{ padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                                  title="Download File">
                                  <FaDownload style={{ fontSize: '16px', color: 'inherit' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {!loading && totalPages > 1 && (
                  <div className="acad-res-paginator">
                    <button disabled={page === 1} onClick={() => setPage(page - 1)} className="acad-res-page-btn">Prev</button>
                    <span>Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="acad-res-page-btn">Next</button>
                  </div>
                )}
              </>
            )}

            {/* ═══ MY UPLOADS VIEW ═══ */}
            {activeView === "my-uploads" && (
              <>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div className="acad-upload-stat-card">
                    <FaCloudUploadAlt style={{ fontSize: '22px', color: '#166534' }} />
                    <div><h4>{uploadStats.total}</h4><p>Total Uploads</p></div>
                  </div>
                  <div className="acad-upload-stat-card">
                    <FaCheckCircle style={{ fontSize: '22px', color: '#16a34a' }} />
                    <div><h4>{uploadStats.approved}</h4><p>Approved</p></div>
                  </div>
                  <div className="acad-upload-stat-card">
                    <FaClock style={{ fontSize: '22px', color: '#f59e0b' }} />
                    <div><h4>{uploadStats.pending}</h4><p>Pending</p></div>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="acad-res-toolbar">
                  <div className="acad-res-search-box">
                    <FaSearch />
                    <input type="text" placeholder="Search your uploads..." value={uploadSearch}
                      onChange={(e) => setUploadSearch(e.target.value)} />
                  </div>
                  <select value={uploadStatusFilter}
                    onChange={(e) => setUploadStatusFilter(e.target.value)}
                    style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', cursor: 'pointer' }}>
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Uploads Table */}
                <div className="acad-res-table-scroller">
                  <table className="acad-res-data-table">
                    <thead>
                      <tr>
                        <th>FILE</th>
                        <th>CATEGORY</th>
                        <th>STATUS</th>
                        <th>UPLOADED</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 0' }}>Loading uploads...</td></tr>
                      ) : filteredUploads.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px 0' }}>No uploads found.</td></tr>
                      ) : (() => {
                        const startIdx = (uploadPage - 1) * uploadLimit;
                        const paginatedUploads = filteredUploads.slice(startIdx, startIdx + uploadLimit);
                        return paginatedUploads.map((item) => {
                          const badge = getStatusBadge(item.approval_status);
                          return (
                            <tr key={item.id}>
                              <td>
                                <div className="acad-res-file-cell">
                                  <div style={{ padding: '8px', borderRadius: '8px', display: 'flex', background: '#f1f5f9' }}>
                                    {getFileIcon(item.file_type)}
                                  </div>
                                  <div>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#1e293b' }}>{item.title}</p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{item.document_type || item.category}</p>
                                  </div>
                                </div>
                              </td>
                              <td><span className="acad-res-subject-tag">{(item.category || '').replace('_', ' ')}</span></td>
                              <td>
                                <span className={`acad-status-badge ${badge.cls}`}>
                                  {badge.icon} {badge.text}
                                </span>
                              </td>
                              <td>{new Date(item.created_at).toLocaleDateString()}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => openViewModal(item)}
                                    style={{ padding: '8px 14px', background: '#166534', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaEye /> View
                                  </button>
                                  <button onClick={(e) => handleDownload(e, item)}
                                    style={{ padding: '8px 12px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' }}
                                    title="Download">
                                    <FaDownload />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()
                      }
                    </tbody>
                  </table>
                </div>

                {/* Uploads Pagination */}
                {filteredUploads.length > uploadLimit && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {Math.min(uploadLimit, filteredUploads.length - (uploadPage - 1) * uploadLimit)} of {filteredUploads.length} uploads</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button onClick={() => setUploadPage(p => Math.max(1, p - 1))} disabled={uploadPage <= 1}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: uploadPage <= 1 ? '#f1f5f9' : 'white', cursor: uploadPage <= 1 ? 'not-allowed' : 'pointer' }}>
                        <FaChevronLeft />
                      </button>
                      <span style={{ fontSize: '13px', color: '#475569' }}>Page {uploadPage} of {Math.ceil(filteredUploads.length / uploadLimit)}</span>
                      <button onClick={() => setUploadPage(p => Math.min(Math.ceil(filteredUploads.length / uploadLimit), p + 1))} disabled={uploadPage >= Math.ceil(filteredUploads.length / uploadLimit)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: uploadPage >= Math.ceil(filteredUploads.length / uploadLimit) ? '#f1f5f9' : 'white', cursor: uploadPage >= Math.ceil(filteredUploads.length / uploadLimit) ? 'not-allowed' : 'pointer' }}>
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* ═══ VIEW UPLOADED MATERIAL MODAL ═══ */}
      {viewModalOpen && viewItem && (
        <div className="acad-view-modal-overlay" onClick={closeViewModal}>
          <div className="acad-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="acad-view-modal-header">
              <h3>Uploaded Material Details</h3>
              <button className="acad-view-modal-close" onClick={closeViewModal}><FaTimes /></button>
            </div>

            <div className="acad-view-modal-body">
              {/* Document Preview */}
              <div className="acad-view-modal-preview">
                {viewItem.file_type && viewItem.file_type.includes("image") ? (
                  <img src={viewItem.file_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : viewItem.file_type === "application/pdf" ? (
                  <iframe
                    src={`${import.meta.env.VITE_API_URL}/api/proxy-pdf?url=${encodeURIComponent(viewItem.file_url)}`}
                    width="100%" height="100%" frameBorder="0" title="PDF Preview" />
                ) : (
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewItem.file_url)}`}
                    width="100%" height="100%" frameBorder="0" title="Document Preview" />
                )}
              </div>

              {/* Details Grid */}
              <div className="acad-view-modal-details">
                <div className="acad-detail-row">
                  <span className="acad-detail-label">File Name</span>
                  <span className="acad-detail-value">{viewItem.title}</span>
                </div>
                <div className="acad-detail-row">
                  <span className="acad-detail-label">Category</span>
                  <span className="acad-detail-value">{(viewItem.category || '').replace('_', ' ')}</span>
                </div>
                <div className="acad-detail-row">
                  <span className="acad-detail-label">Subject</span>
                  <span className="acad-detail-value">{viewItem.subject || 'N/A'}</span>
                </div>
                <div className="acad-detail-row">
                  <span className="acad-detail-label">Status</span>
                  <span className={`acad-status-badge ${getStatusBadge(viewItem.approval_status).cls}`}>
                    {getStatusBadge(viewItem.approval_status).icon} {getStatusBadge(viewItem.approval_status).text}
                  </span>
                </div>
                <div className="acad-detail-row">
                  <span className="acad-detail-label">Uploaded</span>
                  <span className="acad-detail-value">{new Date(viewItem.created_at).toLocaleString()}</span>
                </div>
                <div className="acad-detail-row">
                  <span className="acad-detail-label">File Size</span>
                  <span className="acad-detail-value">{viewItem.file_size ? `${(viewItem.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <a href={viewItem.file_url} target="_blank" rel="noreferrer"
                  style={{ flex: 1, padding: '12px', background: '#166534', color: 'white', textDecoration: 'none', borderRadius: '12px', textAlign: 'center', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FaEye /> Open Full Screen
                </a>
                <button onClick={(e) => handleDownload(e, viewItem)}
                  style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FaDownload /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;