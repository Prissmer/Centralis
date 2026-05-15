import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js"; 
import { useAuth } from "../Context/AuthContext"; 
import "./Style/F-Sidebar.css";
import {
  FaGraduationCap, FaHome, FaBook, FaUpload, FaFolderOpen, 
  FaDownload, FaFileAlt, FaBell, FaUser, FaSignOutAlt, 
  FaBars, FaArrowLeft, FaCheckCircle
} from "react-icons/fa";

const Sidebar = () => {
  const { signOut } = useAuth(); // Now correctly receives the function
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  
  const [userProfile, setUserProfile] = useState({
    displayName: "Loading...",
    initials: "??",
    dept: "Faculty Member"
  });

  // Fetch Profile Data for the User Card
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data, error } = await supabase
        .from('profiles') 
        .select('display_name, first_name, last_name, role') 
        .eq('id', user.id)
        .single();

      if (data) {
        const name = data.display_name || data.first_name || user.email;
        const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

        setUserProfile({
          displayName: name,
          initials: initials,
          dept: data.role || "Faculty Member" 
        });
      } else {
        setUserProfile(prev => ({ ...prev, displayName: user.email, initials: "U" }));
      }
    };

    fetchUserProfile();
  }, []);

  // Logout Handler
  const handleLogout = async (e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to logout?")) {
      await signOut(); // Triggers the function in AuthContext
      navigate("/", { replace: true });
    }
  };

  // Responsive UI Logic
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setIsMobileOpen(false);
  }, [location.pathname, isMobile]);

  const getLinkClass = (path) => location.pathname === path ? "active" : "";

  return (
    <>
      <button 
        className={`mobile-menu-btn ${isMobileOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <FaArrowLeft /> : <FaBars />}
      </button>

      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileOpen(false)} 
      />

      <div className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-content">
          
          <div className="sidebar-header">
            <div className="logo-box"><FaGraduationCap /></div>
            <div>
              <h2>CENTRALIS</h2>
              <p>Faculty Module</p>
            </div>
          </div>

          <div className="menu-container">
            <p className="section-title">MAIN MENU</p>
            <ul className="menu">
              <li className={getLinkClass("/Dashboard")}><Link to="/Dashboard"><FaHome /> <span>Dashboard</span></Link></li>
              <li className={getLinkClass("/materials")}><Link to="/materials"><FaBook /> <span>Materials</span></Link></li>
              <li className={getLinkClass("/upload")}><Link to="/upload"><FaUpload /> <span>Upload Materials</span></Link></li>
              <li className={getLinkClass("/my-uploads")}><Link to="/my-uploads"><FaFolderOpen /> <span>My Uploads</span></Link></li>
              <li className={getLinkClass("/my-downloads")}><Link to="/my-downloads"><FaDownload /> <span>My Downloads</span></Link></li>
              <li className={getLinkClass("/requirement")}><Link to="/requirement"><FaCheckCircle /> <span>Requirement</span></Link></li>
              <li className={getLinkClass("/templates")}><Link to="/templates"><FaFileAlt /> <span>Templates</span></Link></li>
            </ul>

            <p className="section-title">SYSTEM</p>
            <ul className="menu">
              <li className={getLinkClass("/notifications")}><Link to="/notifications"><FaBell /> <span>Notifications</span></Link></li>
              <li className={getLinkClass("/profile")}><Link to="/profile"><FaUser /> <span>Profile</span></Link></li>
            </ul>
          </div>

          {/* Clicking this entire card triggers the logout logic */}
          <button type="button" className="user-card-logout" onClick={handleLogout}>
            <div className="avatar">{userProfile.initials}</div>
            <div className="user-info">
              <h4>{userProfile.displayName}</h4>
              <p>{userProfile.dept}</p>
            </div>
            <div className="logout-icon-box">
              <FaSignOutAlt />
              <span className="logout-label">Exit</span>
            </div>
          </button>

        </div>
      </div>
    </>
  );
};

export default Sidebar;