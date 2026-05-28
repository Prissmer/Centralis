import React, { useState, useEffect } from 'react';
import "./Style/A-AuditLog.css";
import { useAuth } from "../Context/AuthContext";
import { supabase } from '../lib/supabase'; // 🔥 ADDED THIS LINE
import { 
  FaHistory, 
  FaFilter, 
  FaDownload, 
  FaSearch, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';

const AuditLog = () => {
  const [logData, setLogData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Fetching data from your public.audit_logs table
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching audit logs:", error);
      } else {
        setLogData(data);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

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
      <header className="audit-header">
        <div className="header-title">
          <FaHistory className="title-icon" />
          <h2>Audit Logs</h2>
        </div>
        <div className="header-actions">
          <button className="export-btn">
            <FaDownload /> Export CSV
          </button>
        </div>
      </header>

      <div className="audit-card">
        {/* Filter Bar */}
        <div className="audit-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search by user, action, or target..." />
          </div>
          <div className="filter-group">
            <select className="log-select">
              <option>All Actions</option>
              <option>Logins</option>
              <option>Materials</option>
              <option>System</option>
            </select>
            <button className="filter-btn">
              <FaFilter /> Filters
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>USER ID</th>
                <th>ACTION</th>
                <th>TARGET TABLE</th>
                <th>DESCRIPTION</th>
                {/* Removed IP and STATUS as they are not in your DB schema yet */}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Loading logs...</td>
                </tr>
              ) : logData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No audit logs found.</td>
                </tr>
              ) : (
                logData.map((log) => (
                  <tr key={log.log_id}>
                    <td className="time-cell">{formatDate(log.created_at)}</td>
                    {/* Displaying UUID directly. You may want to fetch user profiles later to show names */}
                    <td className="user-cell" title={log.user_id}>
                      <strong>{log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}</strong>
                    </td>
                    <td>
                      <span className={`action-tag ${log.action ? log.action.toLowerCase().replace(" ", "-") : 'default'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="target-cell">{log.target_table} (ID: {log.target_id})</td>
                    <td className="description-cell">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="audit-footer">
          <p>Showing {logData.length} events</p>
          <div className="pagination">
            <button className="page-btn"><FaChevronLeft /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn"><FaChevronRight /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;