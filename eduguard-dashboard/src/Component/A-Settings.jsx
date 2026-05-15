import React from 'react';
import "./Style/A-Settings.css";
import { FaCloudUploadAlt } from 'react-icons/fa';

const Settings = () => {
  return (
    <div className="settings-page-wrapper">
      <header className="settings-header">
        <h2>System Settings</h2>
      </header>

      <div className="settings-max-container">
        <div className="settings-section">
          <h3>General Settings</h3>
          <div className="input-grid">
            <div className="input-group">
              <label>System Name</label>
              <input type="text" defaultValue="EduGuard AI" />
            </div>
            <div className="input-group">
              <label>Contact Email</label>
              <input type="email" defaultValue="admin@eduguard.edu" />
            </div>
          </div>

          <div className="upload-area">
            <label>Logo Upload</label>
            <div className="drag-drop-zone">
              <FaCloudUploadAlt className="upload-icon" />
              <p>Click to upload or drag and drop</p>
            </div>
          </div>
        </div>

        <div className="settings-section divider">
          <h3>AI Configuration</h3>
          <div className="flex-config">
            <div className="config-text">
              <p className="main-label">Similarity Threshold</p>
              <p className="sub-label">Flag content above this percentage</p>
            </div>
            <input type="number" className="small-input" defaultValue="40" />
          </div>

          <div className="flex-config">
            <div className="config-text">
              <p className="main-label">Auto-Backup</p>
              <p className="sub-label">Daily database backup</p>
            </div>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-ghost">Cancel</button>
          <button className="btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;