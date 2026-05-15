import React, { useState } from "react";
import "./Style/F-MyDownloads.css";
import {
  FaFilePdf,
  FaFileWord,
  FaFilePowerpoint,
  FaFileAlt,
  FaReceipt,
  FaDownload,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaDownload as FaDownloadIcon,
  FaEye
} from "react-icons/fa";

const MyDownloads = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState(null);
  const [filterTime, setFilterTime] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [downloads] = useState([
    {
      id: 1,
      title: "Syllabus",
      subject: "Object Oriented Programming",
      subjectCode: "CS203",
      date: "2026-01-10",
      downloadCount: 3,
      fileType: "pdf",
      fileIcon: <FaFilePdf />,
      fileIconColor: "red",
      size: "2.4 MB",
      lastDownloaded: "2026-01-10",
      receipt: {
        transactionId: "TRX-2026-001234",
        downloadDate: "2026-01-10 14:30:25",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/120.0.0.0",
        fileUrl: "/downloads/syllabus_oop.pdf"
      }
    },
    {
      id: 2,
      title: "Module 2 - Inheritance",
      subject: "Object Oriented Programming",
      subjectCode: "CS203",
      date: "2026-01-08",
      downloadCount: 2,
      fileType: "pdf",
      fileIcon: <FaFilePdf />,
      fileIconColor: "red",
      size: "3.1 MB",
      lastDownloaded: "2026-01-08",
      receipt: {
        transactionId: "TRX-2026-001235",
        downloadDate: "2026-01-08 10:15:42",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/120.0.0.0",
        fileUrl: "/downloads/module2_oop.pdf"
      }
    },
    {
      id: 3,
      title: "Module 3 - Stacks and Queues",
      subject: "Data Structures",
      subjectCode: "CS204",
      date: "2026-01-08",
      downloadCount: 1,
      fileType: "pdf",
      fileIcon: <FaFilePdf />,
      fileIconColor: "red",
      size: "4.2 MB",
      lastDownloaded: "2026-01-08",
      receipt: {
        transactionId: "TRX-2026-001236",
        downloadDate: "2026-01-08 09:45:18",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/120.0.0.0",
        fileUrl: "/downloads/module3_ds.pdf"
      }
    },
    {
      id: 4,
      title: "Final Exam Reviewer",
      subject: "Database Systems",
      subjectCode: "CS301",
      date: "2026-01-05",
      downloadCount: 5,
      fileType: "pdf",
      fileIcon: <FaFilePdf />,
      fileIconColor: "red",
      size: "1.8 MB",
      lastDownloaded: "2026-01-05",
      receipt: {
        transactionId: "TRX-2026-001237",
        downloadDate: "2026-01-05 16:20:33",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/120.0.0.0",
        fileUrl: "/downloads/final_exam_reviewer.pdf"
      }
    },
    {
      id: 5,
      title: "OBTLP Document",
      subject: "Web Development",
      subjectCode: "CS401",
      date: "2025-12-28",
      downloadCount: 2,
      fileType: "word",
      fileIcon: <FaFileWord />,
      fileIconColor: "blue",
      size: "1.2 MB",
      lastDownloaded: "2025-12-28",
      receipt: {
        transactionId: "TRX-2025-001238",
        downloadDate: "2025-12-28 11:10:05",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/120.0.0.0",
        fileUrl: "/downloads/obtlp_webdev.docx"
      }
    },
    {
      id: 6,
      title: "Course Syllabus",
      subject: "Algorithms",
      subjectCode: "CS205",
      date: "2025-12-20",
      downloadCount: 1,
      fileType: "pdf",
      fileIcon: <FaFilePdf />,
      fileIconColor: "red",
      size: "1.5 MB",
      lastDownloaded: "2025-12-20",
      receipt: {
        transactionId: "TRX-2025-001239",
        downloadDate: "2025-12-20 13:45:22",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/120.0.0.0",
        fileUrl: "/downloads/algorithms_syllabus.pdf"
      }
    },
    {
      id: 7,
      title: "Normalization PPT",
      subject: "Database Systems",
      subjectCode: "CS301",
      date: "2025-12-15",
      downloadCount: 3,
      fileType: "ppt",
      fileIcon: <FaFilePowerpoint />,
      fileIconColor: "orange",
      size: "5.6 MB",
      lastDownloaded: "2025-12-15",
      receipt: {
        transactionId: "TRX-2025-001240",
        downloadDate: "2025-12-15 09:30:15",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome/120.0.0.0",
        fileUrl: "/downloads/normalization.pptx"
      }
    }
  ]);

  const getFileIconColorClass = (color) => {
    switch(color) {
      case 'red':
        return 'file-icon-red';
      case 'blue':
        return 'file-icon-blue';
      case 'orange':
        return 'file-icon-orange';
      case 'green':
        return 'file-icon-green';
      default:
        return 'file-icon-red';
    }
  };

  const getFileTypeLabel = (fileType) => {
    switch(fileType) {
      case 'pdf':
        return 'PDF';
      case 'word':
        return 'DOCX';
      case 'ppt':
        return 'PPT';
      default:
        return fileType.toUpperCase();
    }
  };

  const handleViewReceipt = (download) => {
    setSelectedDownload(download);
    setShowReceiptModal(true);
  };

  const handleDownloadAgain = (download) => {
    alert(`Downloading: ${download.title}\nThis would download the file in a real application.`);
  };

  const handleFilter = (time) => {
    setFilterTime(time);
    setShowFilterMenu(false);
  };

  const filterDownloads = () => {
    let filtered = downloads;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(download =>
        download.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        download.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        download.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply time filter
    const now = new Date();
    if (filterTime === "week") {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter(download => new Date(download.date) >= weekAgo);
    } else if (filterTime === "month") {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = filtered.filter(download => new Date(download.date) >= monthAgo);
    } else if (filterTime === "year") {
      const yearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      filtered = filtered.filter(download => new Date(download.date) >= yearAgo);
    }
    
    return filtered;
  };

  const filteredDownloads = filterDownloads();
  const totalDownloads = downloads.reduce((sum, d) => sum + d.downloadCount, 0);

  return (
    <div className="mydownloads-container">
      <div className="mydownloads">
        {/* Header */}
        <div className="mydownloads-header">
          <div>
            <h2>My Downloads</h2>
            <p>Access and manage your downloaded materials</p>
          </div>
        </div>

        {/* Content */}
        <div className="mydownloads-content">
          {/* Stats Overview */}
          <div className="stats-overview">
            <div className="stat-card-mini">
              <div className="stat-icon-mini">
                <FaDownloadIcon />
              </div>
              <div className="stat-info">
                <span className="stat-value-mini">{totalDownloads}</span>
                <span className="stat-label-mini">Total Downloads</span>
              </div>
            </div>
            <div className="stat-card-mini">
              <div className="stat-icon-mini">
                <FaFileAlt />
              </div>
              <div className="stat-info">
                <span className="stat-value-mini">{downloads.length}</span>
                <span className="stat-label-mini">Unique Files</span>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search downloads by title or subject..."
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
                <FaFilter /> {filterTime === "all" ? "All Time" : filterTime === "week" ? "Last Week" : filterTime === "month" ? "Last Month" : "Last Year"}
              </button>
              {showFilterMenu && (
                <div className="filter-menu">
                  <button onClick={() => handleFilter("all")} className="filter-option">
                    All Time
                  </button>
                  <button onClick={() => handleFilter("week")} className="filter-option">
                    Last Week
                  </button>
                  <button onClick={() => handleFilter("month")} className="filter-option">
                    Last Month
                  </button>
                  <button onClick={() => handleFilter("year")} className="filter-option">
                    Last Year
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Downloads List */}
          <div className="downloads-card">
            <div className="downloads-header">
              <h3>Download History</h3>
              <span className="downloads-count">{filteredDownloads.length} items</span>
            </div>

            <div className="downloads-list">
              {filteredDownloads.map((download) => (
                <div key={download.id} className="download-item">
                  <div className="download-info">
                    <div className={`file-icon-large ${getFileIconColorClass(download.fileIconColor)}`}>
                      {download.fileIcon}
                    </div>
                    <div className="file-details">
                      <h4 className="file-title">{download.title}</h4>
                      <div className="file-meta">
                        <span className="subject">{download.subject} ({download.subjectCode})</span>
                        <span className="separator">•</span>
                        <span className="date">
                          <FaCalendarAlt /> {new Date(download.date).toLocaleDateString()}
                        </span>
                        <span className="separator">•</span>
                        <span className="file-type">{getFileTypeLabel(download.fileType)}</span>
                        <span className="separator">•</span>
                        <span className="size">{download.size}</span>
                      </div>
                      <div className="download-stats">
                        <span className="download-count">
                          <FaDownloadIcon /> Downloaded {download.downloadCount} time{download.downloadCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="download-actions">
                    <button 
                      className="action-btn receipt-btn"
                      onClick={() => handleViewReceipt(download)}
                    >
                      <FaReceipt /> View Receipt
                    </button>
                    <button 
                      className="action-btn download-again-btn"
                      onClick={() => handleDownloadAgain(download)}
                    >
                      <FaDownload /> Download Again
                    </button>
                  </div>
                </div>
              ))}

              {filteredDownloads.length === 0 && (
                <div className="empty-state">
                  <FaFileAlt className="empty-icon" />
                  <h3>No downloads found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedDownload && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Download Receipt</h3>
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="receipt-header">
                <div className={`receipt-icon ${getFileIconColorClass(selectedDownload.fileIconColor)}`}>
                  {selectedDownload.fileIcon}
                </div>
                <div className="receipt-title">
                  <h4>{selectedDownload.title}</h4>
                  <p>{selectedDownload.subject}</p>
                </div>
              </div>
              
              <div className="receipt-details">
                <div className="receipt-row">
                  <span className="receipt-label">Transaction ID:</span>
                  <span className="receipt-value">{selectedDownload.receipt.transactionId}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Download Date:</span>
                  <span className="receipt-value">{selectedDownload.receipt.downloadDate}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">IP Address:</span>
                  <span className="receipt-value">{selectedDownload.receipt.ipAddress}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">User Agent:</span>
                  <span className="receipt-value">{selectedDownload.receipt.userAgent}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">File Size:</span>
                  <span className="receipt-value">{selectedDownload.size}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">File Type:</span>
                  <span className="receipt-value">{getFileTypeLabel(selectedDownload.fileType)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn secondary" onClick={() => setShowReceiptModal(false)}>
                Close
              </button>
              <button className="modal-btn primary" onClick={() => handleDownloadAgain(selectedDownload)}>
                <FaDownload /> Download Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDownloads;