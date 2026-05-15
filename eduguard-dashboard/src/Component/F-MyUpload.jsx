import React, { useState } from "react";
import "./Style/F-MyUploads.css";
import {
  FaFileAlt,
  FaFilePowerpoint,
  FaFileWord,
  FaFilePdf,
  FaHistory,
  FaEdit,
  FaTimesCircle,
  FaRedo,
  FaFilter,
  FaPlus,
  FaEye,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaCloudUploadAlt,
  FaBookOpen,
  FaDownload
} from "react-icons/fa";

const MyUploads = () => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [uploads, setUploads] = useState([
    {
      id: 1,
      document: "OBTLP",
      documentType: "OBTLP",
      subject: "Programming 1",
      subjectCode: "CS101",
      version: "2026",
      status: "approved",
      statusText: "Approved",
      statusColor: "green",
      fileName: "OBTLP_CS101_2026.pdf",
      uploadDate: "2024-01-15",
      fileIcon: <FaFileAlt />,
      fileIconColor: "primary"
    },
    {
      id: 2,
      document: "Module 3 - Stacks and Queues",
      documentType: "Module",
      subject: "Data Structures",
      subjectCode: "CS204",
      version: "2026",
      status: "pending",
      statusText: "Pending",
      statusColor: "orange",
      fileName: "Module_3_Stacks_Queues.pdf",
      uploadDate: "2024-01-18",
      fileIcon: <FaFilePowerpoint />,
      fileIconColor: "orange"
    },
    {
      id: 3,
      document: "Syllabus",
      documentType: "Syllabus",
      subject: "Web Development",
      subjectCode: "CS401",
      version: "2025",
      status: "revision",
      statusText: "Revision Required",
      statusColor: "red",
      fileName: "WebDev_Syllabus_2025.docx",
      uploadDate: "2024-01-10",
      fileIcon: <FaFileWord />,
      fileIconColor: "blue"
    },
    {
      id: 4,
      document: "Module 1 - Introduction",
      documentType: "Module",
      subject: "Object Oriented Programming",
      subjectCode: "CS203",
      version: "2026",
      status: "approved",
      statusText: "Approved",
      statusColor: "green",
      fileName: "OOP_Module1_2026.pdf",
      uploadDate: "2024-01-05",
      fileIcon: <FaFilePdf />,
      fileIconColor: "red"
    },
    {
      id: 5,
      document: "Final Exam",
      documentType: "Exam",
      subject: "Database Systems",
      subjectCode: "CS301",
      version: "2026",
      status: "pending",
      statusText: "Pending",
      statusColor: "orange",
      fileName: "DB_Final_Exam_2026.pdf",
      uploadDate: "2024-01-20",
      fileIcon: <FaFileAlt />,
      fileIconColor: "primary"
    },
    {
      id: 6,
      document: "PPT - Normalization",
      documentType: "PPT",
      subject: "Database Systems",
      subjectCode: "CS301",
      version: "2026",
      status: "revision",
      statusText: "Revision Required",
      statusColor: "red",
      fileName: "Normalization_PPT.pptx",
      uploadDate: "2024-01-12",
      fileIcon: <FaFilePowerpoint />,
      fileIconColor: "orange"
    },
    {
      id: 7,
      document: "Assignment 1",
      documentType: "Assignment",
      subject: "Algorithms",
      subjectCode: "CS205",
      version: "2026",
      status: "approved",
      statusText: "Approved",
      statusColor: "green",
      fileName: "Algorithms_Assignment1.pdf",
      uploadDate: "2024-01-08",
      fileIcon: <FaFilePdf />,
      fileIconColor: "red"
    }
  ]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved':
        return <FaCheckCircle />;
      case 'pending':
        return <FaClock />;
      case 'revision':
        return <FaExclamationTriangle />;
      default:
        return <FaClock />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved':
        return 'status-badge approved';
      case 'pending':
        return 'status-badge pending';
      case 'revision':
        return 'status-badge revision';
      default:
        return 'status-badge';
    }
  };

  const getFileIconColorClass = (color) => {
    switch(color) {
      case 'primary':
        return 'file-icon-primary';
      case 'orange':
        return 'file-icon-orange';
      case 'blue':
        return 'file-icon-blue';
      case 'red':
        return 'file-icon-red';
      default:
        return 'file-icon-primary';
    }
  };

  const handleViewDetails = (upload) => {
    alert(`Viewing details for: ${upload.document}\nSubject: ${upload.subject}\nStatus: ${upload.statusText}`);
  };

  const handleEdit = (upload) => {
    alert(`Editing: ${upload.document}`);
  };

  const handleWithdraw = (id) => {
    if (window.confirm("Are you sure you want to withdraw this upload?")) {
      setUploads(uploads.filter(upload => upload.id !== id));
    }
  };

  const handleResubmit = (upload) => {
    alert(`Resubmitting: ${upload.document}\nThis would open the upload form with pre-filled data.`);
  };

  const handleNewUpload = () => {
    alert("Navigating to upload page...");
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
    setShowFilterMenu(false);
  };

  const filteredUploads = uploads.filter(upload => {
    const matchesStatus = filterStatus === "all" || upload.status === filterStatus;
    const matchesSearch = upload.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         upload.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         upload.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: uploads.length,
    approved: uploads.filter(u => u.status === 'approved').length,
    pending: uploads.filter(u => u.status === 'pending').length,
    revision: uploads.filter(u => u.status === 'revision').length
  };

  return (
    <div className="myuploads-container">
      <div className="myuploads">
        {/* Header */}
        <div className="myuploads-header">
          <div>
            <h2>My Uploads</h2>
            <p>Track and manage your submitted materials</p>
          </div>
        </div>

        {/* Content */}
        <div className="myuploads-content">
          {/* Stats Cards - Matching Dashboard Design */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper">
                <FaCloudUploadAlt className="stat-icon" />
              </div>
              <div className="stat-content">
                <h4>{stats.total}</h4>
                <p>Total Uploads</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper approved-bg">
                <FaCheckCircle className="stat-icon approved" />
              </div>
              <div className="stat-content">
                <h4>{stats.approved}</h4>
                <p>Approved</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper pending-bg">
                <FaClock className="stat-icon pending" />
              </div>
              <div className="stat-content">
                <h4>{stats.pending}</h4>
                <p>Pending</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper revision-bg">
                <FaExclamationTriangle className="stat-icon revision" />
              </div>
              <div className="stat-content">
                <h4>{stats.revision}</h4>
                <p>Revision</p>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search uploads by title, subject, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-wrapper">
              <button 
                className="filter-btn"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <FaFilter /> Filter
              </button>
              {showFilterMenu && (
                <div className="filter-menu">
                  <button onClick={() => handleFilter("all")} className="filter-option">
                    All ({stats.total})
                  </button>
                  <button onClick={() => handleFilter("approved")} className="filter-option">
                    <FaCheckCircle /> Approved ({stats.approved})
                  </button>
                  <button onClick={() => handleFilter("pending")} className="filter-option">
                    <FaClock /> Pending ({stats.pending})
                  </button>
                  <button onClick={() => handleFilter("revision")} className="filter-option">
                    <FaExclamationTriangle /> Revision ({stats.revision})
                  </button>
                </div>
              )}
            </div>

            <button className="new-upload-btn" onClick={handleNewUpload}>
              <FaPlus /> New Upload
            </button>
          </div>

          {/* Uploads Card */}
          <div className="uploads-card">
            {/* Desktop Table View */}
            <div className="desktop-table-view">
              <table className="uploads-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Subject</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUploads.map((upload) => (
                    <tr key={upload.id} className="upload-row">
                      <td className="document-cell">
                        <div className="document-info">
                          <div className={`document-icon ${getFileIconColorClass(upload.fileIconColor)}`}>
                            {upload.fileIcon}
                          </div>
                          <div>
                            <div className="document-name">{upload.document}</div>
                            <div className="document-type">{upload.documentType}</div>
                          </div>
                        </div>
                       </td>
                      <td className="subject-cell">
                        <div className="subject-info">
                          <div className="subject-name">{upload.subject}</div>
                          <div className="subject-code">{upload.subjectCode}</div>
                        </div>
                       </td>
                      <td className="version-cell">
                        <span className="version-badge">v{upload.version}</span>
                       </td>
                      <td className="status-cell">
                        <div className={getStatusBadgeClass(upload.status)}>
                          {getStatusIcon(upload.status)}
                          <span>{upload.statusText}</span>
                        </div>
                       </td>
                      <td className="actions-cell">
                        <button 
                          className="action-btn" 
                          onClick={() => handleViewDetails(upload)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {upload.status !== 'revision' && (
                          <button 
                            className="action-btn" 
                            onClick={() => handleEdit(upload)}
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                        )}
                        {upload.status === 'pending' && (
                          <button 
                            className="action-btn withdraw" 
                            onClick={() => handleWithdraw(upload.id)}
                            title="Withdraw"
                          >
                            <FaTimesCircle />
                          </button>
                        )}
                        {upload.status === 'revision' && (
                          <button 
                            className="action-btn resubmit" 
                            onClick={() => handleResubmit(upload)}
                            title="Resubmit"
                          >
                            <FaRedo /> Resubmit
                          </button>
                        )}
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUploads.length === 0 && (
                <div className="empty-state">
                  <FaFileAlt className="empty-icon" />
                  <h3>No uploads found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>

            {/* Mobile Card View */}
            <div className="mobile-card-view">
              {filteredUploads.map((upload) => (
                <div key={upload.id} className="upload-card">
                  <div className="upload-card-header">
                    <div className={`document-icon ${getFileIconColorClass(upload.fileIconColor)}`}>
                      {upload.fileIcon}
                    </div>
                    <div className="upload-header-info">
                      <h4>{upload.document}</h4>
                      <span className="document-type-badge">{upload.documentType}</span>
                    </div>
                    <div className={getStatusBadgeClass(upload.status)}>
                      {getStatusIcon(upload.status)}
                      <span>{upload.statusText}</span>
                    </div>
                  </div>
                  
                  <div className="upload-card-body">
                    <div className="info-row">
                      <span className="info-label">Subject:</span>
                      <span className="info-value">{upload.subject} ({upload.subjectCode})</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Version:</span>
                      <span className="version-badge-mobile">v{upload.version}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Uploaded:</span>
                      <span className="info-value">{new Date(upload.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="upload-card-footer">
                    <button className="action-btn-mobile" onClick={() => handleViewDetails(upload)}>
                      <FaEye /> View
                    </button>
                    {upload.status !== 'revision' && (
                      <button className="action-btn-mobile" onClick={() => handleEdit(upload)}>
                        <FaEdit /> Edit
                      </button>
                    )}
                    {upload.status === 'pending' && (
                      <button className="action-btn-mobile withdraw" onClick={() => handleWithdraw(upload.id)}>
                        <FaTimesCircle /> Withdraw
                      </button>
                    )}
                    {upload.status === 'revision' && (
                      <button className="action-btn-mobile resubmit" onClick={() => handleResubmit(upload)}>
                        <FaRedo /> Resubmit
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredUploads.length === 0 && (
                <div className="empty-state">
                  <FaFileAlt className="empty-icon" />
                  <h3>No uploads found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyUploads;