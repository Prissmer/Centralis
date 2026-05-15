import React from "react";
import "./Style/F-Dashboard.css";
import {
  FaSearch,
  FaBookOpen,
  FaCloudUploadAlt,
  FaClock,
  FaCheckCircle,
  FaFilePdf,
  FaFileWord,
  FaDownload,
  FaChevronRight
} from "react-icons/fa";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <main className="dashboard">
        
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h2>Dashboard</h2>
            <p>Welcome back, here's what's happening today</p>
          </div>

          <div className="header-right">
            <div className="search-box">
              <FaSearch className="icon" />
              <input type="text" placeholder="Search courses, materials..." />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="dashboard-content">

          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="banner-content">
              <h3>Good Morning, Mr. Mendoza 👋</h3>
              <p>
                You have 2 pending approvals and 3 new notifications. Your OBTLP compliance is at 85%.
              </p>
              <div className="banner-buttons">
                <button className="primary-btn">Upload Materials</button>
                <button className="secondary-btn">View Notifications</button>
              </div>
            </div>
            <div className="banner-decoration"></div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="card">
              <div className="card-icon-wrapper">
                <FaBookOpen className="card-icon" />
              </div>
              <div className="card-content">
                <h4>3</h4>
                <p>Assigned Courses</p>
              </div>
            </div>

            <div className="card">
              <div className="card-icon-wrapper">
                <FaCloudUploadAlt className="card-icon" />
              </div>
              <div className="card-content">
                <h4>8</h4>
                <p>Materials Uploaded</p>
              </div>
            </div>

            <div className="card">
              <div className="card-icon-wrapper">
                <FaClock className="card-icon orange" />
              </div>
              <div className="card-content">
                <h4>2</h4>
                <p>Pending Approvals</p>
              </div>
            </div>

            <div className="card">
              <div className="card-icon-wrapper">
                <FaCheckCircle className="card-icon" />
              </div>
              <div className="card-content">
                <h4>85%</h4>
                <p>Compliance</p>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="bottom-grid">
            {/* Recent Downloads */}
            <div className="recent">
              <div className="section-header">
                <h3>Recent Downloads</h3>
                <button className="view-all-btn">View All <FaChevronRight /></button>
              </div>

              <div className="recent-item">
                <FaFilePdf className="file-icon pdf" />
                <div className="item-info">
                  <p>Data Structures Syllabus</p>
                  <span>2 hours ago</span>
                </div>
                <FaDownload className="download-icon" />
              </div>

              <div className="recent-item">
                <FaFileWord className="file-icon word" />
                <div className="item-info">
                  <p>OOP Module 1 - Introduction to Classes</p>
                  <span>Yesterday</span>
                </div>
                <FaDownload className="download-icon" />
              </div>

              <div className="recent-item">
                <FaFilePdf className="file-icon pdf" />
                <div className="item-info">
                  <p>Database Management Systems - Midterms</p>
                  <span>2 days ago</span>
                </div>
                <FaDownload className="download-icon" />
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="pending">
              <div className="section-header">
                <h3>Pending Approvals</h3>
                <button className="view-all-btn">View All <FaChevronRight /></button>
              </div>

              <div className="pending-item">
                <div className="pending-status waiting"></div>
                <div className="pending-info">
                  <p>Module 3 - Data Structures and Algorithms</p>
                  <span>Awaiting review</span>
                </div>
              </div>

              <div className="pending-item">
                <div className="pending-status revision"></div>
                <div className="pending-info">
                  <p>OBTLP - Programming 2 (Java)</p>
                  <span>Revision requested</span>
                </div>
              </div>

              <div className="pending-item">
                <div className="pending-status waiting"></div>
                <div className="pending-info">
                  <p>Final Exam - Web Development</p>
                  <span>Under review</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;