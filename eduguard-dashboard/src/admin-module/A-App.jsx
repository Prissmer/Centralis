import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


import Sidebar from "../Component/A-Sidebar.jsx"; 
import Dashboard from "../Component/A-Dashboard.jsx";
import AChecklist from "../Component/A-Checklist.jsx"; // ✅ Fixed Path
import UserManagement from "../Component/A-UserManagement.jsx";
import RoleAndPermission from "../Component/A-RoleandPermission.jsx";
import Materials from "../Component/A-Materials.jsx";
import LogHistory from "../Component/A-LogHistory.jsx";
import Settings from "../Component/A-Settings.jsx";
import Requirement from "../Component/A-Requirement.jsx"


function App() {
  return (
  <div className="h-screen overflow-hidden bg-slate-50">

    {/* FIXED SIDEBAR */}
    <Sidebar />

    {/* MAIN CONTENT */}
    <main className="max-[992px]:ml-0 ml-[280px] h-screen overflow-y-auto overflow-x-hidden">
      <div className="min-w-0 p-0">
        <Routes>

          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/checklist"
            element={<AChecklist />}
          />

          <Route
            path="/users"
            element={<UserManagement />}
          />

          <Route
            path="/roles"
            element={<RoleAndPermission />}
          />

          <Route
            path="/materials"
            element={<Materials />}
          />

          <Route
            path="/Requirement"
            element={<Requirement />}
          />

          <Route
            path="/audit-logs"
            element={<LogHistory />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Routes>
      </div>
    </main>

  </div>
);
}

export default App;