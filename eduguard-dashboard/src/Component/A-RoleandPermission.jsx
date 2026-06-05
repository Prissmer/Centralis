import React from 'react';
import "./Style/A-RoleandPermission.css";
import { 
  FaShieldAlt, 
  FaChalkboardTeacher, 
  FaSearch, 
  FaBell 
} from 'react-icons/fa';

const RoleAndPermission = () => {
  const permissions = [
    { module: "User Management", admin: true, faculty: false },
    { module: "System Settings", admin: true, faculty: false },
    { module: "Create Assessments", admin: true, faculty: true },
    { module: "View Materials", admin: true, faculty: true },
    { module: "Upload Materials", admin: true, faculty: true },
    { module: "AI Reports", admin: true, faculty: true },
  ];

  return (
    <div className="roles-content">
      {/* Header Bar */}
      {/* Header Bar */}
      <header className="responsive-header">
        <div className="header-left">
          <h2 style={{
            fontSize: '28px', fontWeight: 700,
            background: 'linear-gradient(135deg, #166534, #14532d)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent', margin: 0
          }}>Roles & Permissions</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Configure system access matrices</p>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: 'white',
            border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px',
            minWidth: '320px', transition: 'all 0.2s ease'
          }}>
            <FaSearch style={{ color: '#94a3b8', fontSize: '16px' }} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                marginLeft: '10px', fontSize: '14px', width: '100%'
              }}
            />
          </div>
          <button className="notif-btn" style={{ marginLeft: '15px' }}>
            <FaBell />
            <span className="dot"></span>
          </button>
        </div>
      </header>

      <div style={{ marginTop: '90px' }}>

      {/* Role Cards */}
      <div className="role-cards-grid">
        <div className="role-card">
          <div className="role-icon-box red">
            <FaShieldAlt />
          </div>
          <div className="role-info">
            <h3>Administrator</h3>
            <p>Full system access</p>
          </div>
        </div>

        <div className="role-card">
          <div className="role-icon-box purple">
            <FaChalkboardTeacher />
          </div>
          <div className="role-info">
            <h3>Faculty</h3>
            <p>Manage courses & assessments</p>
          </div>
        </div>

      </div>

      {/* Permission Matrix */}
      <div className="matrix-card">
        <h3>Permission Matrix</h3>
        <table className="matrix-table">
          <thead>
            <tr>
              <th>MODULE</th>
              <th>ADMIN</th>
              <th>FACULTY</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((item, index) => (
              <tr key={index}>
                <td className="module-name">{item.module}</td>
                <td>
                  <input type="checkbox" checked={item.admin} readOnly className="matrix-checkbox" />
                </td>
                <td>
                  <input type="checkbox" checked={item.faculty} readOnly className="matrix-checkbox" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="matrix-footer">
          <button className="save-btn">Save Changes</button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RoleAndPermission;