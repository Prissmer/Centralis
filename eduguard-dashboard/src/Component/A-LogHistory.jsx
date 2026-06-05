import React, { useState, useEffect } from 'react';
import "./Style/A-AuditLog.css";
import { useAuth } from "../Context/AuthContext";
import { 
  FaHistory, 
  FaFilter, 
  FaDownload, 
  FaSearch, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';

const LogHistory = () => {
  const [logData, setLogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");

  const fetchLogHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: searchTerm,
        action: actionFilter
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/log-history?${params}`);
      const data = await res.json();

      if (res.ok) {
        setLogData(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch log history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogHistory();
  }, [page, searchTerm, actionFilter]);

  // Helper function to format the Supabase timestamp
  const formatDate = (dateString) => {
    const options = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options).replace(',', ' •');
  };

  return (
    <div className="audit-content">
      <header className="responsive-header">
        <div className="header-left">
          <h2 style={{
            fontSize: '28px', fontWeight: 700,
            background: 'linear-gradient(135deg, #166534, #14532d)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent', margin: 0
          }}>Log History</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Monitor system activities and audit logs</p>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
          <button className="export-btn" style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </header>

      <div style={{ marginTop: '90px' }}>

      <div className="audit-card">
        {/* Filter Bar */}
        <div className="audit-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by user, action, or description..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-group">
            <select 
              className="log-select"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option>All Actions</option>
              <option>File Upload</option>
              <option>File Download</option>
              <option>File Replacement</option>
              <option>Acknowledge File</option>
              <option>Login</option>
              <option>Logout</option>
            </select>
          </div>
        </div>

        {/* Log History Table */}
        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>USER</th>
                <th>ACTION</th>
                <th>TARGET</th>
                <th>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading logs...</td>
                </tr>
              ) : logData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No log history found.</td>
                </tr>
              ) : (
                logData.map((log) => (
                  <tr key={log.log_id}>
                    <td className="time-cell">{formatDate(log.created_at)}</td>
                    <td className="user-cell">
                      <strong>{log.user_display_name || 'System'}</strong>
                    </td>
                    <td>
                      <span className={`action-tag ${log.action ? log.action.toLowerCase().replace(/ /g, "-") : 'default'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="target-cell">{log.target_table}</td>
                    <td className="description-cell">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="audit-footer">
          <p>Showing {logData.length} of {totalItems} events</p>
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <FaChevronLeft />
            </button>
            <span style={{ padding: '0 12px', fontSize: '14px' }}>Page {page} of {totalPages}</span>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default LogHistory;