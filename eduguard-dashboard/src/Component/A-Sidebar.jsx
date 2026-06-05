import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext"; 
import "./Style/A-Sidebar.css";
import { 
  FaThLarge, 
  FaUsers, 
  FaUserShield, 
  FaBookOpen, 
  FaHistory, 
  FaCog, 
  FaSignOutAlt, 
  FaBars, 
  FaTimes,
  FaCheckCircle,
  FaRegCheckSquare // Added icon for Checklist
} from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth(); 
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleLogout = async (e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        await signOut(); 
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Logout failed:", error.message);
      }
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email || "Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className={`mobile-menu-btn ${isOpen ? "open" : ""}`} 
        onClick={toggleSidebar}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? "active" : ""}`} 
        onClick={toggleSidebar} 
      />

      <aside className={`sidebar ${isOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-content">
          
          {/* Header */}
          <div className="sidebar-header">
            <div className="logo-box">E</div>
            <div>
              <h2>EduGuard</h2>
              <p>Admin Portal</p>
            </div>
          </div>

          <div className="menu-container">
            <p className="section-title">Main Menu</p>
            <ul className="menu">
              <li>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaThLarge /> <span>Dashboard</span>
                </NavLink>
              </li>
              {/* ✅ Added Checklist Page Item Here */}
              <li>
                <NavLink to="/checklist" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaRegCheckSquare /> <span>Checklist</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/users" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaUsers /> <span>User Management</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/roles" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaUserShield /> <span>Roles & Permissions</span>
                </NavLink>
              </li>
            </ul>

            <p className="section-title">Academic</p>
            <ul className="menu">
              <li>
                <NavLink to="/materials" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaBookOpen /> <span>Materials</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/Requirement" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaCheckCircle /> <span>Requirements</span>
                </NavLink>
              </li>
            </ul>

            <p className="section-title">System</p>
            <ul className="menu">
              <li>
                <NavLink to="/audit-logs" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaHistory /> <span>Log History</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaCog /> <span>Settings</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Card Logout Button */}
          <button type="button" className="user-card-logout" onClick={handleLogout}>
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <h4>{displayName}</h4>
              <p>{user?.user_metadata?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
            </div>
            <div className="logout-icon-box">
              <FaSignOutAlt />
              <span className="logout-label">Exit</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;