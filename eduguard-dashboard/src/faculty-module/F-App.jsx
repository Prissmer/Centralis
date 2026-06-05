import React from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "../Component/F-Sidebar.jsx";
import Dashboard from "../Component/F-Dashboard.jsx";
import Materials from "../Component/F-Materials.jsx";
import MyDownload from "../Component/F-MyDownload.jsx";
import Requirement from "../Component/F-Requirement.jsx";
import Notification from "../Component/F-Notification.jsx";
import Profile from "../Component/F-Profile.jsx";

function App() {
  return (
    <div className="app-layout">

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/my-downloads" element={<MyDownload />} />
          <Route path="/Requirement" element={<Requirement />} />
          <Route path="/notifications" element={<Notification />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>

    </div>
  );
}

export default App;