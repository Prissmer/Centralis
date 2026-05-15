import React from 'react';
import "./Style/A-RoleandPermission.css";
import { 
  FaShieldAlt, 
  FaChalkboardTeacher, 
  FaUserGraduate, 
  FaSearch, 
  FaBell 
} from 'react-icons/fa';

const RoleAndPermission = () => {
  const permissions = [
    { module: "User Management", admin: true, faculty: false, student: false },
    { module: "System Settings", admin: true, faculty: false, student: false },
    { module: "Create Assessments", admin: true, faculty: true, student: false },
    { module: "View Materials", admin: true, faculty: true, student: true },
    { module: "Upload Materials", admin: true, faculty: true, student: true },
    { module: "AI Reports", admin: true, faculty: true, student: false },
  ];

  return (
    <div className="roles-content">
      {/* Header Bar */}
      <header className="roles-header">
        <h2>Roles & Permissions</h2>
        <div className="header-right">
          <div className="search-box">
            <FaSearch className="icon" />
            <input type="text" placeholder="Search anything..." />
          </div>
          <button className="notif-btn">
            <FaBell />
            <span className="dot"></span>
          </button>
        </div>
      </header>

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

        <div className="role-card">
          <div className="role-icon-box blue">
            <FaUserGraduate />
          </div>
          <div className="role-info">
            <h3>Student</h3>
            <p>View materials & submit work</p>
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
              <th>STUDENT</th>
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
                <td>
                  <input type="checkbox" checked={item.student} readOnly className="matrix-checkbox" />
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
  );
};

export default RoleAndPermission;