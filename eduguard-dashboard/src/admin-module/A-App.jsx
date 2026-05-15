import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


import Sidebar from "../Component/A-Sidebar.jsx"; 
import Dashboard from "../Component/A-Dashboard.jsx";
import UserManagement from "../Component/A-UserManagement.jsx";
import RoleAndPermission from "../Component/A-RoleandPermission.jsx";
import Materials from "../Component/A-Materials.jsx";
import AuditLog from "../Component/A-AuditLog.jsx";
import Settings from "../Component/A-Settings.jsx";
import Requirement from "../Component/A-Requirement.jsx"


function App() {
  return (
      <div className="app-layout">
        
        <Sidebar />

        <div className="main-content">
          <Routes>
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/roles" element={<RoleAndPermission />} />

            {/* Academic Routes */}
            <Route path="/materials" element={<Materials />} />
            <Route path="/Requirement" element={<Requirement />} />

            {/* System Routes */}
            <Route path="/audit-logs" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>

      </div>
  );
}

export default App;