import React from 'react';
import "./Style/A-AuditLog.css";
import { 
  FaHistory, 
  FaFilter, 
  FaDownload, 
  FaSearch, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';

const AuditLog = () => {
  const logData = [
    { id: 1, user: "Alice Johnson", action: "Material Approval", target: "Algorithms_Notes.pdf", ip: "192.168.1.45", time: "Oct 26, 2023 • 10:42 AM", status: "Success" },
    { id: 2, user: "System", action: "Auto-Backup", target: "Database_Main", ip: "127.0.0.1", time: "Oct 26, 2023 • 04:00 AM", status: "Success" },
    { id: 3, user: "Admin", action: "Role Update", target: "Dr. Robert Smith", ip: "192.168.1.12", time: "Oct 25, 2023 • 02:15 PM", status: "Success" },
    { id: 4, user: "Unknown", action: "Failed Login", target: "Admin Portal", ip: "45.22.11.9", time: "Oct 25, 2023 • 10:38 AM", status: "Warning" },
    { id: 5, user: "Prof. Emily Davis", action: "Settings Change", target: "Similarity Threshold", ip: "192.168.1.5", time: "Oct 24, 2023 • 09:05 AM", status: "Success" },
  ];

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
                <th>USER</th>
                <th>ACTION</th>
                <th>TARGET</th>
                <th>IP ADDRESS</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {logData.map((log) => (
                <tr key={log.id}>
                  <td className="time-cell">{log.time}</td>
                  <td className="user-cell"><strong>{log.user}</strong></td>
                  <td>
                    <span className={`action-tag ${log.action.toLowerCase().replace(" ", "-")}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="target-cell">{log.target}</td>
                  <td className="ip-cell">{log.ip}</td>
                  <td>
                    <span className={`status-dot ${log.status.toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="audit-footer">
          <p>Showing 1 to 5 of 1,240 events</p>
          <div className="pagination">
            <button className="page-btn"><FaChevronLeft /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn"><FaChevronRight /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;