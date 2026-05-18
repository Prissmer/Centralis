import React, { useState } from 'react';
import { 
  FaCheckCircle, 
  FaTimes, 
  FaCloudUploadAlt,
  FaBell,
  FaUserCircle,
  FaRegFileAlt,
  FaRegFilePdf,
  FaRegFileWord,
  FaRegFilePowerpoint,
  FaClock,
  FaCalendarAlt,
  FaClipboardList
} from "react-icons/fa";
import './Style/F-Requirement.css';

const RequirementsPage = () => {
  const [activeTab, setActiveTab] = useState('Material');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const tabs = ['Material', 'Assessment', 'Teacher document'];

  // Requirements data organized by category
  const [itemsByTab, setItemsByTab] = useState({
    'Material': {
      completed: [
        { id: 1, name: 'Course Outline', type: 'PDF', size: '2.4 MB', dueDate: 'Jan 15, 2026', submittedDate: 'Jan 10, 2026', version: 'v2' }
      ],
      pending: [
        { id: 2, name: 'OBTLP', type: 'Word', size: '1.2 MB', dueDate: 'Jan 30, 2026', description: 'Outcome-Based Teaching and Learning Plan' },
        { id: 3, name: 'PowerPoint Presentation', type: 'PPT', size: '5.8 MB', dueDate: 'Feb 5, 2026', description: 'Week 1-3 Lecture Materials' }
      ]
    },
    'Assessment': {
      completed: [
        { id: 4, name: 'Quiz 1 Blueprint', type: 'PDF', size: '0.8 MB', dueDate: 'Jan 20, 2026', submittedDate: 'Jan 18, 2026', version: 'v1' }
      ],
      pending: [
        { id: 5, name: 'Final Exam', type: 'PDF', size: '3.2 MB', dueDate: 'Feb 28, 2026', description: 'Comprehensive Final Examination' },
        { id: 6, name: 'Midterm Assessment', type: 'Word', size: '1.5 MB', dueDate: 'Feb 15, 2026', description: 'Midterm Evaluation Materials' }
      ]
    },
    'Teacher document': {
      completed: [
        { id: 7, name: 'Syllabus Approval', type: 'PDF', size: '1.1 MB', dueDate: 'Jan 10, 2026', submittedDate: 'Jan 8, 2026', version: 'v3' }
      ],
      pending: [
        { id: 8, name: 'Teaching Load Form', type: 'Excel', size: '0.5 MB', dueDate: 'Feb 10, 2026', description: 'Faculty Teaching Assignment' }
      ]
    }
  });

  const handleOpenModal = (item, category) => {
    setSelectedItem({ ...item, category });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleFakeSubmit = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const currentData = { ...itemsByTab[activeTab] };
    const pendingItems = currentData.pending.filter(
      item => item.id !== selectedItem.id
    );
    const completedItem = { 
      ...selectedItem, 
      status: 'Complete',
      submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      version: 'v1'
    };
    
    currentData.completed = [...currentData.completed, completedItem];
    currentData.pending = pendingItems;

    setItemsByTab({
      ...itemsByTab,
      [activeTab]: currentData
    });

    handleCloseModal();
  };

  const getFileIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'pdf': return <FaRegFilePdf />;
      case 'word': return <FaRegFileWord />;
      case 'ppt': return <FaRegFilePowerpoint />;
      default: return <FaRegFileAlt />;
    }
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
            <div className="freq-stat-icon freq-total">
              <FaClipboardList />
            </div>
            <div className="freq-stat-info">
              <h3>{stats.total}</h3>
              <p>Total Requirements</p>
            </div>
          </div>
          <div className="freq-stat-card">
            <div className="freq-stat-icon freq-completed-stat">
              <FaCheckCircle />
            </div>
            <div className="freq-stat-info">
              <h3>{stats.completed}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="freq-stat-card">
            <div className="freq-stat-icon freq-pending-stat">
              <FaClock />
            </div>
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

        {/* Requirements Content - Split by Status */}
        <div className="freq-panel-content">
          
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
                    <div className="freq-item-icon">
                      {getFileIcon(item.type)}
                    </div>
                    <div className="freq-item-details">
                      <div className="freq-item-name">{item.name}</div>
                      <div className="freq-item-meta">
                        {item.type && <span className="freq-meta-badge">{item.type}</span>}
                        {item.size && <span className="freq-meta-text">{item.size}</span>}
                        {item.dueDate && (
                          <span className="freq-meta-text freq-due-date">
                            <FaCalendarAlt /> Due: {item.dueDate}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="freq-item-description">{item.description}</div>
                      )}
                    </div>
                    <div className="freq-item-action">
                      <button 
                        className="freq-upload-btn"
                        onClick={() => handleOpenModal(item, 'pending')}
                      >
                        <FaCloudUploadAlt />
                        Upload
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
                    <div className="freq-item-icon freq-completed-icon">
                      {getFileIcon(item.type)}
                    </div>
                    <div className="freq-item-details">
                      <div className="freq-item-name">
                        {item.name}
                        {item.version && <span className="freq-version-badge">{item.version}</span>}
                      </div>
                      <div className="freq-item-meta">
                        {item.type && <span className="freq-meta-badge">{item.type}</span>}
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
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="freq-modal-overlay" onClick={handleCloseModal}>
          <div className="freq-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="freq-modal-header">
              <h3>Upload Document</h3>
              <button className="freq-modal-close-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleFakeSubmit} className="freq-modal-body">
              <p className="freq-modal-target-info">
                Uploading file for: <strong>{selectedItem?.name}</strong>
              </p>

              <div className="freq-file-dropzone">
                <FaCloudUploadAlt className="freq-upload-icon" />
                <input type="file" id="fileAttachment" required />
                <label htmlFor="fileAttachment">
                  <span>Click to browse</span> or drag your file here
                </label>
                <p className="freq-file-hint">Supported: PDF, DOC, DOCX, PPT, PPTX (Max 10MB)</p>
              </div>

              <div className="freq-modal-footer">
                <button type="button" className="freq-btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="freq-btn-submit">
                  Submit File
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