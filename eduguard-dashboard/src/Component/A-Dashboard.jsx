import React from 'react';
import "./Style/A-Dashboard.css";
import { 
  FaUsers, 
  FaBuilding, 
  FaFileAlt, 
  FaExclamationTriangle, 
  FaPlus, 
  FaSearch, 
  FaDatabase, 
  FaCheckCircle, 
  FaBell 
} from 'react-icons/fa';

const Dashboard = () => {
  return (
    <div className="dashboard-content">
      
      {/* Top Header Bar */}
      <header className="dashboard-top-bar">
        <h2>Dashboard Overview</h2>
        <div className="top-bar-right">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search anything..." />
          </div>
          <button className="top-notification-btn">
            <FaBell />
            <span className="notification-dot"></span>
          </button>
        </div>
      </header>

      {/* Top Stats Grid */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue"><FaUsers /></div>
            <span className="trend">+12%</span>
          </div>
          <p>Total Users</p>
          <h3>1,245</h3>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple"><FaBuilding /></div>
            <span className="trend">+2</span>
          </div>
          <p>Departments</p>
          <h3>8</h3>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon orange"><FaFileAlt /></div>
            <span className="trend">+5%</span>
          </div>
          <p>Materials</p>
          <h3>3,420</h3>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon red"><FaExclamationTriangle /></div>
            <span className="attention-tag">Requires Attention</span>
          </div>
          <p>AI Flags</p>
          <h3>12</h3>
        </div>
      </div>

      {/* Middle Section: Graph and Quick Actions */}
      <div className="middle-section">
        <div className="chart-card">
          <div className="chart-header">
            <h3>System Activity</h3>
            <select className="chart-select">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="chart-placeholder">
            {/* Mock Graph Visual */}
            <div className="mock-graph"></div>
            <div className="chart-legend">
              <span className="legend-item"><div className="dot green"></div> User Logins</span>
              <span className="legend-item"><div className="dot light-green"></div> Uploads</span>
            </div>
          </div>
        </div>

        <div className="actions-card">
          <h3>Quick Actions</h3>
          <button className="action-btn green-btn"><FaPlus /> Add New User</button>
          <button className="action-btn blue-btn"><FaSearch /> Review Flagged Content</button>
          <button className="action-btn gray-btn"><FaDatabase /> Backup Database</button>
          
          <div className="system-status">
            <FaCheckCircle className="status-icon" />
            <div>
              <p className="status-title">System Operational</p>
              <p className="status-sub">All services running normally</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent System Activities Table */}
      <div className="table-card">
        <div className="table-header">
          <h3>Recent System Activities</h3>
          <button className="view-all">View All Logs</button>
        </div>
        <table className="activity-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>ACTION</th>
              <th>TIME</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alice Johnson</td>
              <td>Login</td>
              <td>10:42 AM</td>
              <td><span className="badge success">Success</span></td>
            </tr>
            <tr>
              <td>Unknown</td>
              <td>Failed Login</td>
              <td>10:38 AM</td>
              <td><span className="badge failed">Failed</span></td>
            </tr>
            <tr>
              <td>Dr. Robert Smith</td>
              <td>Uploaded Material</td>
              <td>09:15 AM</td>
              <td><span className="badge success">Success</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;