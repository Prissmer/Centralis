import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ensure this path is correct
import { useAuth } from '../Context/AuthContext'; // Bring in your auth context
import { 
  FaCheckCircle, FaTimes, FaCloudUploadAlt, FaBell, FaUserCircle,
  FaRegFileAlt, FaRegFilePdf, FaRegFileWord, FaRegFilePowerpoint,
  FaClock, FaCalendarAlt, FaCalendarDay, FaClipboardList, FaEye,
  FaChevronLeft, FaChevronRight, FaTimesCircle, FaExclamationTriangle
} from "react-icons/fa";
import './Style/F-Requirement.css';

const RequirementsPage = () => {
  const { user } = useAuth(); // Get the currently logged-in user
  const [activeTab, setActiveTab] = useState('Material');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadFile, setUploadFile] = useState(null); // Track the real file
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState(null); // File preview modal
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const reqPageLimit = 10;

  const tabs = ['Material', 'Assessment', 'Teacher document'];

  // Map database categories to UI tab names
  const categoryMap = {
    'materials': 'Material',
    'assessment': 'Assessment',
    'teacher_documents': 'Teacher document'
  };

  // State to hold the live data from Supabase
  const [itemsByTab, setItemsByTab] = useState({
    'Material': { completed: [], pending: [] },
    'Assessment': { completed: [], pending: [] },
    'Teacher document': { completed: [], pending: [] }
  });

  // ==========================================
  // 1. FETCH LIVE DATA FROM SUPABASE
  // ==========================================
  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Get all active requirements from the checklist
      const { data: reqs, error: reqError } = await supabase
        .from('requirements')
        .select('*')
        .eq('active', true);
      
      if (reqError) throw reqError;

      // 2. Get all submissions specifically for THIS user
      const { data: subs, error: subError } = await supabase
        .from('submissions')
        .select('*')
        .eq('uploaded_by', user.id);

      if (subError) throw subError;

      // 3. Process and sort the data into the Tabs
      const newData = {
        'Material': { completed: [], pending: [] },
        'Assessment': { completed: [], pending: [] },
        'Teacher document': { completed: [], pending: [] }
      };

      reqs.forEach((req) => {
        const tabName = categoryMap[req.category];
        if (!tabName) return; // Skip if category is unrecognized

        const isRoleAssigned = !req.assigned_roles || req.assigned_roles.length === 0 || req.assigned_roles.includes(user.role);
        const isUserAssigned = req.assigned_users && req.assigned_users.includes(user.id);
        
        // If they are not assigned to this requirement, do not show it to them
        if (!isRoleAssigned && !isUserAssigned) return;

        // Check if the user has a submission for this specific requirement
        const submission = subs.find(s => s.requirement_id === req.requirement_id);

        const isOverdue = !submission && req.due_date && new Date(req.due_date) < new Date();

        const todayStr = new Date().toISOString().split('T')[0];
        const isDueToday = !submission && !isOverdue && req.due_date && new Date(req.due_date).toISOString().split('T')[0] === todayStr;

        // Format the item for the UI
        const itemFormat = {
          id: req.requirement_id,
          name: req.requirement_name,
          category: req.category, // Keep the raw DB category for uploading later
          type: submission ? submission.file_type : 'PDF', // Extracted from file
          size: submission ? `${(submission.file_size / 1024 / 1024).toFixed(2)} MB` : '--',
          dueDate: req.due_date ? new Date(req.due_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No Deadline',
          isOverdue: isOverdue,
          isDueToday: isDueToday,
          submittedDate: submission ? new Date(submission.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
          version: 'v1',
          description: `Requires Admin Acknowledgement: ${req.needs_approval ? 'Yes' : 'No'}`,
          submissionId: submission ? submission.id : null,
          fileUrl: submission ? submission.file_url : null,
          fileName: submission ? submission.title : null
        };

        if (submission) {
          newData[tabName].completed.push({ ...itemFormat, status: 'Complete' });
        } else {
          newData[tabName].pending.push(itemFormat);
        }
      });

      setItemsByTab(newData);
    } catch (error) {
      console.error("Error fetching data:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Run the fetch when the component loads or the user changes
  useEffect(() => {
    fetchData();
  }, [user]);

  // ==========================================
  // 2. HANDLE REAL UPLOADS TO BACKEND
  // ==========================================
  const handleRealSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !uploadFile) return alert("Please select a file to upload.");
    
    setIsUploading(true);

    try {
      // If replacing an existing file, use the replace endpoint
      if (selectedItem.isReplacement && selectedItem.submissionId) {
        const form = new FormData();
        form.append("file", uploadFile);
        form.append("submission_id", selectedItem.submissionId);
        form.append("userId", user.id);
        form.append("category", selectedItem.category);
        form.append("school_year", "2025-2026");
        form.append("semester", "1st Semester");

        const res = await fetch("http://localhost:5000/api/submissions/replace-file", {
          method: "PUT",
          body: form
        });

        if (!res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const errorData = await res.json();
            throw new Error(errorData.error || "File replacement failed");
          } else {
            throw new Error(`Server error (${res.status}). Make sure the backend is restarted.`);
          }
        }

        const { error: auditError } = await supabase
          .from('log_history')
          .insert([{
            user_id: user.id,
            action: 'File Replacement',
            target_table: 'submissions',
            target_id: selectedItem.submissionId,
            description: `Replaced file: ${uploadFile.name} for ${selectedItem.name}`
          }]);

        if (auditError) console.error("Log history failed:", auditError.message);

        await fetchData();
        handleCloseModal();
        return;
      }

      const form = new FormData();
      form.append("file", uploadFile);
      form.append("userId", user.id);
      form.append("requirement_id", selectedItem.id);
      form.append("category", selectedItem.category);
      
      // Provide defaults needed by your backend routing
      form.append("school_year", "2025-2026"); 
      form.append("semester", "1st Semester");
      form.append("document_type", selectedItem.name);

      const res = await fetch("http://localhost:5000/upload-material", {
        method: "POST",
        body: form
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      // ==========================================
      // NEW: Log Activity to Supabase Audit Logs
      // ==========================================
      const { error: auditError } = await supabase
        .from('log_history')
        .insert([
          {
            user_id: user.id,
            action: 'File Upload',
            target_table: 'requirements',
            target_id: selectedItem.id,
            description: `Uploaded file: ${uploadFile.name} for ${selectedItem.name}`
          }
        ]);

      if (auditError) {
        console.error("Failed to save log:", auditError.message);
      }
      // ==========================================

      // Success! Refetch data to instantly move it from Pending to Completed
      await fetchData(); 
      handleCloseModal();
    } catch (err) {
      console.error("Upload error:", err.message);
      alert("Failed to upload: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================
  // UI HANDLERS
  // ==========================================
  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setUploadFile(null); // Clear previous file
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setUploadFile(null);
  };

  const getFileIcon = (type) => {
    const fileType = String(type).toLowerCase();
    if (fileType.includes('pdf')) return <FaRegFilePdf />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FaRegFileWord />;
    if (fileType.includes('powerpoint') || fileType.includes('ppt') || fileType.includes('presentation')) return <FaRegFilePowerpoint />;
    return <FaRegFileAlt />;
  };

  const getStats = () => {
    let total = 0;
    let completed = 0;
    let pending = 0;
    let overdue = 0;
    let dueToday = 0;
    
    Object.keys(itemsByTab).forEach(tab => {
      total += itemsByTab[tab].completed.length + itemsByTab[tab].pending.length;
      completed += itemsByTab[tab].completed.length;
      pending += itemsByTab[tab].pending.length;
      overdue += itemsByTab[tab].pending.filter(item => item.isOverdue).length;
      dueToday += itemsByTab[tab].pending.filter(item => item.isDueToday).length;
    });
    
    return { total, completed, pending, overdue, dueToday };
  };

  const stats = getStats();

  return (
    <div className="freq-main-content">
      {/* Header */}
      <header className="freq-main-header">
        <div className="freq-header-left">
          <h1>Requirement</h1>
          <p className="freq-breadcrumb">Track and manage your academic requirements</p>
        </div>
      </header>

      <div className="freq-panel-container">
        {/* Stats Overview */}
        <div className="freq-stats-grid">
          <div className="freq-stat-card">
            <div className="freq-stat-icon freq-total"><FaClipboardList /></div>
            <div className="freq-stat-info">
              <h3>{stats.total}</h3>
              <p>Total Requirements</p>
            </div>
          </div>
          <div className="freq-stat-card">
            <div className="freq-stat-icon freq-completed-stat"><FaCheckCircle /></div>
            <div className="freq-stat-info">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="freq-stat-card">
            <div className="freq-stat-icon freq-pending-stat"><FaClock /></div>
            <div className="freq-stat-info">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="freq-stat-card">
            <div className="freq-stat-icon" style={{background: '#ffedd5', color: '#ea580c'}}><FaCalendarDay /></div>
            <div className="freq-stat-info">
              <h3>{stats.dueToday}</h3>
              <p>Due Today</p>
            </div>
          </div>
          <div className="freq-stat-card">
            <div className="freq-stat-icon overdue-status"><FaExclamationTriangle /></div>
            <div className="freq-stat-info">
              <h3>{stats.overdue}</h3>
              <p style={{color: '#dc2626'}}>Overdue</p>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="freq-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`freq-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); setPendingPage(1); setCompletedPage(1); }}
            >
              {tab}
              <span className="freq-tab-count">
                {itemsByTab[tab].pending.length + itemsByTab[tab].completed.length}
              </span>
            </button>
          ))}
        </div>

        {/* Requirements Content */}
        <div className="freq-panel-content">
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading your requirements...
            </div>
          ) : (
            <>
              {/* Pending Requirements Section */}
              {itemsByTab[activeTab].pending.length > 0 && (
                <div className="freq-category-section">
                  <div className="freq-category-header">
                    <div className="freq-category-title">
                      <span className="freq-category-dot freq-dot-pending"></span>
                      <h3>Pending Requirements</h3>
                    </div>
                    <span className="freq-category-count">{itemsByTab[activeTab].pending.length} items</span>
                  </div>
                  
                  <div className="freq-item-list">
                    {itemsByTab[activeTab].pending.slice((pendingPage - 1) * reqPageLimit, pendingPage * reqPageLimit).map((item) => (
                      <div key={item.id} className="freq-row-item">
                        <div className="freq-item-icon">{getFileIcon(item.type)}</div>
                        <div className="freq-item-details">
                          <div className="freq-item-name">{item.name}</div>
                          <div className="freq-item-meta">
                            {item.description && <span className="freq-meta-text">{item.description}</span>}
                            {item.dueDate && item.dueDate !== 'No Deadline' && (
                              <span className="freq-meta-text" style={{ color: item.isOverdue ? '#dc2626' : (item.isDueToday ? '#ea580c' : '#ea580c'), fontWeight: '600' }}>
                                <FaClock style={{marginRight: '4px'}} /> Due: {item.dueDate}
                                {item.isOverdue && <span style={{marginLeft: '8px', padding: '2px 6px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '10px'}}>OVERDUE</span>}
                                {item.isDueToday && <span style={{marginLeft: '8px', padding: '2px 6px', background: '#ffedd5', color: '#ea580c', borderRadius: '4px', fontSize: '10px'}}>DUE TODAY</span>}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="freq-item-action">
                          <button 
                            className="freq-upload-btn"
                            onClick={() => handleOpenModal(item)}
                          >
                            <FaCloudUploadAlt /> Upload
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {itemsByTab[activeTab].pending.length > reqPageLimit && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                      <button onClick={() => setPendingPage(p => Math.max(1, p - 1))} disabled={pendingPage <= 1}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: pendingPage <= 1 ? '#f1f5f9' : 'white', cursor: pendingPage <= 1 ? 'not-allowed' : 'pointer' }}>
                        <FaChevronLeft />
                      </button>
                      <span style={{ fontSize: '13px', color: '#475569' }}>Page {pendingPage} of {Math.ceil(itemsByTab[activeTab].pending.length / reqPageLimit)}</span>
                      <button onClick={() => setPendingPage(p => p + 1)} disabled={pendingPage >= Math.ceil(itemsByTab[activeTab].pending.length / reqPageLimit)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: pendingPage >= Math.ceil(itemsByTab[activeTab].pending.length / reqPageLimit) ? '#f1f5f9' : 'white', cursor: pendingPage >= Math.ceil(itemsByTab[activeTab].pending.length / reqPageLimit) ? 'not-allowed' : 'pointer' }}>
                        <FaChevronRight />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Requirements Section */}
              {itemsByTab[activeTab].completed.length > 0 && (
                <div className="freq-category-section">
                  <div className="freq-category-header">
                    <div className="freq-category-title">
                      <span className="freq-category-dot freq-dot-completed"></span>
                      <h3>Completed Requirements</h3>
                    </div>
                    <span className="freq-category-count">{itemsByTab[activeTab].completed.length} items</span>
                  </div>
                  
                  <div className="freq-item-list">
                    {itemsByTab[activeTab].completed.slice((completedPage - 1) * reqPageLimit, completedPage * reqPageLimit).map((item) => (
                      <div key={item.id} className="freq-row-item">
                        <div className="freq-item-icon freq-completed-icon">{getFileIcon(item.type)}</div>
                        <div className="freq-item-details">
                          <div className="freq-item-name">
                            {item.name}
                            {item.version && <span className="freq-version-badge">{item.version}</span>}
                          </div>
                          <div className="freq-item-meta">
                            {item.type && <span className="freq-meta-badge">{item.type.split('/')[1] || item.type}</span>}
                            {item.size && <span className="freq-meta-text">{item.size}</span>}
                            {item.dueDate && item.dueDate !== 'No Deadline' && (
                              <span className="freq-meta-text">
                                <FaClock style={{marginRight: '4px'}} /> Due: {item.dueDate}
                              </span>
                            )}
                            {item.submittedDate && (
                              <span className="freq-meta-text freq-submitted">
                                <FaCheckCircle /> Submitted: {item.submittedDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="freq-item-action" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                          <span className="freq-status-complete">
                            <FaCheckCircle /> Complete
                          </span>
                          {item.fileUrl && (
                            <button 
                              className="freq-upload-btn" 
                              style={{background: '#166534', fontSize: '12px', padding: '6px 10px'}}
                              onClick={() => setPreviewItem(item)}
                            >
                              <FaEye /> View
                            </button>
                          )}
                          <button 
                            className="freq-upload-btn" 
                            style={{background: '#f59e0b', fontSize: '12px', padding: '6px 10px'}}
                            onClick={() => handleOpenModal({ ...item, isReplacement: true })}
                          >
                            <FaCloudUploadAlt /> Replace File
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {itemsByTab[activeTab].completed.length > reqPageLimit && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
                      <button onClick={() => setCompletedPage(p => Math.max(1, p - 1))} disabled={completedPage <= 1}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: completedPage <= 1 ? '#f1f5f9' : 'white', cursor: completedPage <= 1 ? 'not-allowed' : 'pointer' }}>
                        <FaChevronLeft />
                      </button>
                      <span style={{ fontSize: '13px', color: '#475569' }}>Page {completedPage} of {Math.ceil(itemsByTab[activeTab].completed.length / reqPageLimit)}</span>
                      <button onClick={() => setCompletedPage(p => p + 1)} disabled={completedPage >= Math.ceil(itemsByTab[activeTab].completed.length / reqPageLimit)}
                        style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: completedPage >= Math.ceil(itemsByTab[activeTab].completed.length / reqPageLimit) ? '#f1f5f9' : 'white', cursor: completedPage >= Math.ceil(itemsByTab[activeTab].completed.length / reqPageLimit) ? 'not-allowed' : 'pointer' }}>
                        <FaChevronRight />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {itemsByTab[activeTab].pending.length === 0 && itemsByTab[activeTab].completed.length === 0 && (
                <div className="freq-empty-state">
                  <div className="freq-empty-icon">📋</div>
                  <h3>No requirements found</h3>
                  <p>All requirements for this category have been completed</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="freq-modal-overlay" onClick={handleCloseModal}>
          <div className="freq-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="freq-modal-header">
              <h3>{selectedItem?.isReplacement ? 'Replace Document' : 'Upload Document'}</h3>
              <button className="freq-modal-close-icon" onClick={handleCloseModal}><FaTimesCircle /></button>
            </div>
            
            <form onSubmit={handleRealSubmit} className="freq-modal-body">
              <div className="freq-modal-meta-card">
                <div className="freq-meta-col">
                  <span className="freq-meta-label">Target Requirement</span>
                  <span className="freq-meta-value">{selectedItem?.name}</span>
                </div>
                {selectedItem?.dueDate && selectedItem?.dueDate !== 'No Deadline' && (
                  <div className="freq-meta-col" style={{ textAlign: 'right' }}>
                    <span className="freq-meta-label">Deadline</span>
                    <span className="freq-meta-value" style={{ color: '#ea580c' }}>{selectedItem.dueDate}</span>
                  </div>
                )}
              </div>

              {selectedItem?.isReplacement && (
                <div className="freq-modal-warning">
                  <FaExclamationTriangle />
                  <span>This will replace your currently uploaded file.</span>
                </div>
              )}

              <div className="freq-file-dropzone">
                <div className="freq-dropzone-inner">
                  <FaCloudUploadAlt className="freq-upload-icon" />
                  <h4>Select a file to upload</h4>
                  <p>Drag and drop your file here, or click to browse</p>
                  <input 
                    type="file" 
                    id="fileAttachment" 
                    required 
                    onChange={(e) => setUploadFile(e.target.files[0])} 
                  />
                  {uploadFile && (
                    <div className="freq-selected-file">
                      <FaCheckCircle style={{ color: '#2E7D32', marginRight: '6px' }} />
                      <span>{uploadFile.name}</span>
                    </div>
                  )}
                </div>
                <div className="freq-file-hint-banner">
                  Supported formats: PDF, DOC, DOCX, PPT, PPTX (Max 50MB)
                </div>
              </div>

              <div className="freq-modal-footer">
                <button type="button" className="freq-btn-cancel" onClick={handleCloseModal} disabled={isUploading}>
                  Cancel
                </button>
                <button type="submit" className="freq-btn-submit" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Submit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ FILE PREVIEW MODAL ═══ */}
      {previewItem && (
        <div className="freq-modal-overlay" onClick={() => setPreviewItem(null)}>
          <div className="freq-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
            <div className="freq-modal-header">
              <h3>Document Preview</h3>
              <button className="freq-modal-close-icon" onClick={() => setPreviewItem(null)}><FaTimesCircle /></button>
            </div>
            
            <div className="freq-modal-body">
              <div className="freq-modal-meta-card" style={{ marginBottom: '16px' }}>
                <div className="freq-meta-col">
                  <span className="freq-meta-label">File Name</span>
                  <span className="freq-meta-value">{previewItem.fileName || previewItem.name}</span>
                </div>
                {previewItem.submittedDate && (
                  <div className="freq-meta-col" style={{ textAlign: 'right' }}>
                    <span className="freq-meta-label">Submitted On</span>
                    <span className="freq-meta-value" style={{ color: '#2E7D32' }}>{previewItem.submittedDate}</span>
                  </div>
                )}
              </div>

              <div className="freq-preview-viewer" style={{ width: '100%', height: '500px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {previewItem.type && previewItem.type.includes("image") ? (
                   <img src={previewItem.fileUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : previewItem.type === "application/pdf" ? (
                   <iframe src={`http://localhost:5000/api/proxy-pdf?url=${encodeURIComponent(previewItem.fileUrl)}`} width="100%" height="100%" frameBorder="0" title="PDF Preview"></iframe>
                ) : (
                   <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewItem.fileUrl)}`} width="100%" height="100%" frameBorder="0" title="Office Preview"></iframe>
                )}
              </div>

              <div className="freq-modal-footer" style={{ marginTop: '20px' }}>
                 <button onClick={() => setPreviewItem(null)} className="freq-btn-cancel">
                   Close Preview
                 </button>
                 <a 
                   href={previewItem.type && previewItem.type.includes("image") ? previewItem.fileUrl : previewItem.type === "application/pdf" ? `http://localhost:5000/api/proxy-pdf?url=${encodeURIComponent(previewItem.fileUrl)}` : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(previewItem.fileUrl)}`} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="freq-btn-submit" 
                   style={{textDecoration: 'none', display: 'inline-block'}}
                 >
                   Open Full Screen
                 </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsPage;