import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ensure this path is correct
import { useAuth } from '../Context/AuthContext'; // Bring in your auth context
import { 
  FaCheckCircle, FaTimes, FaCloudUploadAlt, FaBell, FaUserCircle,
  FaRegFileAlt, FaRegFilePdf, FaRegFileWord, FaRegFilePowerpoint,
  FaClock, FaCalendarAlt, FaClipboardList
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

        // Check if the user has a submission for this specific requirement
        const submission = subs.find(s => s.requirement_id === req.requirement_id);

        // Format the item for the UI
        const itemFormat = {
          id: req.requirement_id,
          name: req.requirement_name,
          category: req.category, // Keep the raw DB category for uploading later
          type: submission ? submission.file_type : 'PDF', // Extracted from file
          size: submission ? `${(submission.file_size / 1024 / 1024).toFixed(2)} MB` : '--',
          dueDate: 'TBA', // Add to your DB later if needed
          submittedDate: submission ? new Date(submission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
          version: 'v1',
          description: `Requires Admin Approval: ${req.needs_approval ? 'Yes' : 'No'}`
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
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("userId", user.id);
      form.append("requirement_id", selectedItem.id);
      form.append("category", selectedItem.category); // Connects to your backend routing rules!
      
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
        .from('audit_logs')
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
        console.error("Failed to save audit log:", auditError.message);
        // temporarily add this alert so it pops up on your screen:
        alert("AUDIT LOG ERROR: " + auditError.message); 
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
    
    Object.keys(itemsByTab).forEach(tab => {
      total += itemsByTab[tab].completed.length + itemsByTab[tab].pending.length;
      completed += itemsByTab[tab].completed.length;
      pending += itemsByTab[tab].pending.length;
    });
    
    return { total, completed, pending };
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
        </div>
        
        {/* Tab Navigation */}
        <div className="freq-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`freq-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
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
                    {itemsByTab[activeTab].pending.map((item) => (
                      <div key={item.id} className="freq-row-item">
                        <div className="freq-item-icon">{getFileIcon(item.type)}</div>
                        <div className="freq-item-details">
                          <div className="freq-item-name">{item.name}</div>
                          <div className="freq-item-meta">
                            {item.description && <span className="freq-meta-text">{item.description}</span>}
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
                    {itemsByTab[activeTab].completed.map((item) => (
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
                            {item.submittedDate && (
                              <span className="freq-meta-text freq-submitted">
                                <FaCheckCircle /> Submitted: {item.submittedDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="freq-item-action">
                          <span className="freq-status-complete">
                            <FaCheckCircle /> Complete
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
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
              <h3>Upload Document</h3>
              <button className="freq-modal-close-btn" onClick={handleCloseModal}><FaTimes /></button>
            </div>
            
            <form onSubmit={handleRealSubmit} className="freq-modal-body">
              <p className="freq-modal-target-info">
                Uploading file for: <strong>{selectedItem?.name}</strong>
              </p>

              <div className="freq-file-dropzone">
                <FaCloudUploadAlt className="freq-upload-icon" />
                <input 
                  type="file" 
                  id="fileAttachment" 
                  required 
                  onChange={(e) => setUploadFile(e.target.files[0])} // 🔥 Capture the actual file!
                />
                <label htmlFor="fileAttachment">
                  <span>Click to browse</span> or drag your file here
                </label>
                {uploadFile && (
                  <p style={{ marginTop: '10px', color: '#2E7D32', fontWeight: 'bold' }}>
                    Selected: {uploadFile.name}
                  </p>
                )}
                <p className="freq-file-hint">Supported: PDF, DOC, DOCX, PPT, PPTX (Max 50MB)</p>
              </div>

              <div className="freq-modal-footer">
                <button type="button" className="freq-btn-cancel" onClick={handleCloseModal} disabled={isUploading}>
                  Cancel
                </button>
                <button type="submit" className="freq-btn-submit" disabled={isUploading}>
                  {isUploading ? 'Uploading to Cloudinary...' : 'Submit File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementsPage;