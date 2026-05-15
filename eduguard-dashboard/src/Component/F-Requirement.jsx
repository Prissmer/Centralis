import React, { useState } from 'react';
import {
  FaCheck,
  FaTimes,
  FaExclamation,
  FaClock,
  FaBell,
  FaCheckCircle,
  FaTrash,
  FaArchive,
  FaInfoCircle
} from "react-icons/fa";
import './Style/F-Requirement.css';

const RequirementCard = ({ title, status, timestamp, description, type }) => {
  // Mapping logic for icons based on status
  const getStatusIcon = () => {
    switch (type) {
      case 'success': return <FaCheckCircle />;
      case 'error': return <FaTimes />;
      case 'warning': return <FaExclamation />;
      default: return <FaInfoCircle />;
    }
  };

  return (
    <div className={`req-item border-${type} bg-${type}-light`}>
      <div className={`req-status-icon icon-bg-${type}`}>
        {getStatusIcon()}
      </div>
      
      <div className="req-body">
        <div className="req-header-row">
          <h4>{title}</h4>
          <span className="req-timestamp">
            {type === 'success' ? <FaCheck className="mini-icon" /> : <FaClock className="mini-icon" />}
            {timestamp}
          </span>
        </div>
        <p className="req-desc">{description}</p>
      </div>

      <div className="req-controls">
        <button className="control-btn" title="Archive"><FaArchive /></button>
        <button className="control-btn delete" title="Delete"><FaTrash /></button>
      </div>
    </div>
  );
};

const RequirementsPage = () => {
  const [items] = useState([
    {
      id: 1,
      title: "CENTRALIS - Backend Auth",
      status: "Submitted",
      timestamp: "May 05, 2026 • 14:30",
      description: "User authentication logic and Supabase integration complete.",
      type: "success"
    },
    {
      id: 2,
      title: "ITERMS - Traffic Logic",
      status: "Missing",
      timestamp: "Deadline: May 12, 2026",
      description: "Automated fine calculation module is required for the prototype.",
      type: "error"
    },
    {
      id: 3,
      title: "UI Style Guide",
      status: "Pending",
      timestamp: "Updated: May 07, 2026",
      description: "Finalizing Tailwind configuration and global color palettes.",
      type: "warning"
    }
  ]);

  return (
    <div className="req-container">
      <header className="req-main-header">
        <div className="header-text">
          <h2><FaBell className="header-bell" /> My Requirements</h2>
          <p>Track your project milestones and submissions</p>
        </div>
        <div className="req-summary-badge">
          <FaInfoCircle /> {items.filter(i => i.type !== 'success').length} Outstanding
        </div>
      </header>

      <main className="req-content-area">
        <div className="req-card-wrapper">
          <div className="req-card-title">
            <h3>Deliverables</h3>
            <span className="total-count">{items.length} Total</span>
          </div>

          <div className="req-list">
            {items.map(item => (
              <RequirementCard key={item.id} {...item} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequirementsPage;