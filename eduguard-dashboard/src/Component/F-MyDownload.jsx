import React, { useState, useEffect } from "react";
import "./Style/F-MyDownloads.css";
import { useAuth } from "../Context/AuthContext";
import { supabase } from "../lib/supabase";
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
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaTimes
} from "react-icons/fa";

const MyDownloads = () => {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedDownload, setSelectedDownload] = useState(null);
  const [filterTime, setFilterTime] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewItem, setViewItem] = useState(null);

  // Fetch downloads from Supabase via API
  const fetchDownloads = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: searchTerm
      });
      const res = await fetch(`http://localhost:5000/api/downloads/${user.id}?${params}`);
      const data = await res.json();
      if (res.ok) {
        setDownloads(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch downloads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, [user, page, searchTerm]);

  // File icon helper
  const getFileIcon = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('pdf')) return { icon: <FaFilePdf />, color: 'file-icon-red' };
    if (t.includes('word') || t.includes('doc')) return { icon: <FaFileWord />, color: 'file-icon-blue' };
    if (t.includes('ppt') || t.includes('presentation') || t.includes('powerpoint')) return { icon: <FaFilePowerpoint />, color: 'file-icon-orange' };
    return { icon: <FaFileAlt />, color: 'file-icon-red' };
  };

  const getFileTypeLabel = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('pdf')) return 'PDF';
    if (t.includes('word') || t.includes('doc')) return 'DOCX';
    if (t.includes('ppt') || t.includes('presentation')) return 'PPT';
    if (t.includes('image')) return 'IMG';
    return t.split('/').pop()?.toUpperCase() || 'FILE';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleViewReceipt = (download) => {
    setSelectedDownload(download);
    setShowReceiptModal(true);
  };

  const handleDownloadAgain = async (download) => {
    try {
      // Track the redownload
      await fetch("http://localhost:5000/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          submission_id: download.submission_id,
          file_name: download.file_name,
          file_url: download.file_url,
          subject: download.subject,
          file_type: download.file_type,
          file_size: download.file_size
        })
      });

      // Trigger actual file download
      const response = await fetch(download.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', download.file_name || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Refresh list to update count
      fetchDownloads();
    } catch (err) {
      console.error("Redownload failed:", err);
      // Fallback: open in new tab
      window.open(download.file_url, '_blank');
    }
  };

  const handleFilter = (time) => {
    setFilterTime(time);
    setShowFilterMenu(false);
  };

  // Client-side time filter
  const filteredDownloads = downloads.filter(dl => {
    if (filterTime === "all") return true;
    const now = new Date();
    const dlDate = new Date(dl.downloaded_at);
    if (filterTime === "week") return (now - dlDate) <= 7 * 24 * 60 * 60 * 1000;
    if (filterTime === "month") return (now - dlDate) <= 30 * 24 * 60 * 60 * 1000;
    if (filterTime === "year") return (now - dlDate) <= 365 * 24 * 60 * 60 * 1000;
    return true;
  });

  const totalDownloadCount = downloads.reduce((sum, d) => sum + (d.download_count || 1), 0);

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
                <FaDownload />
              </div>
              <div className="stat-info">
                <span className="stat-value-mini">{totalDownloadCount}</span>
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
                placeholder="Search downloads by filename..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
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
                  <button onClick={() => handleFilter("all")} className="filter-option">All Time</button>
                  <button onClick={() => handleFilter("week")} className="filter-option">Last Week</button>
                  <button onClick={() => handleFilter("month")} className="filter-option">Last Month</button>
                  <button onClick={() => handleFilter("year")} className="filter-option">Last Year</button>
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
              {loading ? (
                <div className="empty-state">
                  <FaFileAlt className="empty-icon" />
                  <h3>Loading downloads...</h3>
                </div>
              ) : filteredDownloads.length === 0 ? (
                <div className="empty-state">
                  <FaFileAlt className="empty-icon" />
                  <h3>No downloads found</h3>
                  <p>Download materials from the Materials page to see them here</p>
                </div>
              ) : (
                filteredDownloads.map((download) => {
                  const fileInfo = getFileIcon(download.file_type);
                  return (
                    <div key={download.id} className="download-item">
                      <div className="download-info">
                        <div className={`file-icon-large ${fileInfo.color}`}>
                          {fileInfo.icon}
                        </div>
                        <div className="file-details">
                          <h4 className="file-title">{download.file_name}</h4>
                          <div className="file-meta">
                            <span className="subject">{download.subject || 'N/A'}</span>
                            <span className="separator">•</span>
                            <span className="date">
                              <FaCalendarAlt /> {new Date(download.downloaded_at).toLocaleDateString()}
                            </span>
                            <span className="separator">•</span>
                            <span className="file-type">{getFileTypeLabel(download.file_type)}</span>
                            <span className="separator">•</span>
                            <span className="size">{formatFileSize(download.file_size)}</span>
                          </div>
                          <div className="download-stats">
                            <span className="download-count">
                              <FaDownload /> Downloaded {download.download_count || 1} time{(download.download_count || 1) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="download-actions">
                        <button 
                          className="action-btn receipt-btn"
                          onClick={() => setViewItem(download)}
                        >
                          <FaEye /> View
                        </button>
                        <button 
                          className="action-btn receipt-btn"
                          onClick={() => handleViewReceipt(download)}
                        >
                          <FaReceipt /> Receipt
                        </button>
                        <button 
                          className="action-btn download-again-btn"
                          onClick={() => handleDownloadAgain(download)}
                        >
                          <FaDownload /> Download
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
                <button 
                  onClick={() => setPage(page - 1)} 
                  disabled={page <= 1}
                  style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: page <= 1 ? '#f1f5f9' : 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                >
                  <FaChevronLeft />
                </button>
                <span style={{ fontSize: '14px', color: '#475569' }}>Page {page} of {totalPages}</span>
                <button 
                  onClick={() => setPage(page + 1)} 
                  disabled={page >= totalPages}
                  style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: page >= totalPages ? '#f1f5f9' : 'white', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
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
                <div className={`receipt-icon ${getFileIcon(selectedDownload.file_type).color}`}>
                  {getFileIcon(selectedDownload.file_type).icon}
                </div>
                <div className="receipt-title">
                  <h4>{selectedDownload.file_name}</h4>
                  <p>{selectedDownload.subject || 'N/A'}</p>
                </div>
              </div>
              
              <div className="receipt-details">
                <div className="receipt-row">
                  <span className="receipt-label">Transaction ID:</span>
                  <span className="receipt-value">TRX-{String(selectedDownload.id).substring(0, 12).toUpperCase()}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Download Date:</span>
                  <span className="receipt-value">{new Date(selectedDownload.downloaded_at).toLocaleString()}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">File Name:</span>
                  <span className="receipt-value">{selectedDownload.file_name}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Subject:</span>
                  <span className="receipt-value">{selectedDownload.subject || 'N/A'}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">File Size:</span>
                  <span className="receipt-value">{formatFileSize(selectedDownload.file_size)}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">File Type:</span>
                  <span className="receipt-value">{getFileTypeLabel(selectedDownload.file_type)}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Download Count:</span>
                  <span className="receipt-value">{selectedDownload.download_count || 1}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">File URL:</span>
                  <span className="receipt-value" style={{ wordBreak: 'break-all', fontSize: '12px' }}>
                    <a href={selectedDownload.file_url} target="_blank" rel="noreferrer" style={{ color: '#166534' }}>
                      {selectedDownload.file_url?.substring(0, 60)}...
                    </a>
                  </span>
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
      {/* File Preview Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>File Preview</h3>
              <button className="modal-close" onClick={() => setViewItem(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ marginBottom: '8px', fontWeight: 600, color: '#1e293b', fontSize: '16px' }}>{viewItem.file_name}</p>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                {viewItem.subject || 'N/A'} • {getFileTypeLabel(viewItem.file_type)} • {formatFileSize(viewItem.file_size)}
              </p>
              
              <div style={{ width: '100%', height: '400px', background: '#f8fafc', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                {(viewItem.file_type || '').includes('image') ? (
                  <img src={viewItem.file_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (viewItem.file_type || '').includes('pdf') ? (
                  <iframe
                    src={`http://localhost:5000/api/proxy-pdf?url=${encodeURIComponent(viewItem.file_url)}`}
                    width="100%" height="100%" frameBorder="0" title="PDF Preview" />
                ) : (
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewItem.file_url)}`}
                    width="100%" height="100%" frameBorder="0" title="Document Preview" />
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <a href={viewItem.file_url} target="_blank" rel="noreferrer"
                  style={{ flex: 1, padding: '12px', background: '#166534', color: 'white', textDecoration: 'none', borderRadius: '12px', textAlign: 'center', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <FaEye /> Open Full Screen
                </a>
                <button onClick={() => { handleDownloadAgain(viewItem); setViewItem(null); }}
                  style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
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

export default MyDownloads;