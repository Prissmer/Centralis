import React from 'react';
import "./Style/A-Materials.css";
import { FaSearch, FaFilePdf, FaDownload } from 'react-icons/fa';

const Materials = () => {
  const materialData = [
    { id: 1, title: "Advanced Algorithms Notes", date: "2023-10-24", author: "Alice Johnson", score: 12, status: "Approved" },
    { id: 2, title: "Quantum Physics Essay", date: "2023-10-25", author: "Charlie Brown", score: 85, status: "Flagged" },
    { id: 3, title: "Linear Algebra Cheat Sheet", date: "2023-10-26", author: "David Wilson", score: 45, status: "Under Review" },
    { id: 4, title: "History of Computing", date: "2023-10-26", author: "Alice Johnson", score: 5, status: "Approved" },
  ];

  const getStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');
  
  const getScoreColor = (score) => {
    if (score > 70) return "#ef4444"; // Red
    if (score > 30) return "#22c55e"; // Green (per your UI screenshot)
    return "#22c55e"; // Light Green
  };

  return (
    <div className="materials-content">
      {/* Header with Search only */}
      <header className="materials-header">
        <h2>Materials Oversight</h2>
        <div className="header-right">
          <div className="search-box">
            <FaSearch className="icon" />
            <input type="text" placeholder="Search anything..." />
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="materials-tabs">
        <button className="tab active">All Materials</button>
        <button className="tab">Flagged</button>
        <button className="tab">Under Review</button>
      </div>

      {/* Materials Table Card */}
      <div className="materials-card">
        <table className="materials-table">
          <thead>
            <tr>
              <th>MATERIAL</th>
              <th>UPLOADED BY</th>
              <th>AI SCORE</th>
              <th>STATUS</th>
              <th className="text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {materialData.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="material-info">
                    <div className="pdf-icon-box">
                      <FaFilePdf />
                    </div>
                    <div>
                      <p className="m-title">{item.title}</p>
                      <p className="m-date">{item.date}</p>
                    </div>
                  </div>
                </td>
                <td className="m-author">{item.author}</td>
                <td>
                  <div className="ai-score-container">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${item.score}%`, backgroundColor: getScoreColor(item.score) }}
                      ></div>
                    </div>
                    <span className="score-text" style={{ color: getScoreColor(item.score) }}>{item.score}%</span>
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <div className="action-links">
                    <button className="review-btn">Review</button>
                    <FaDownload className="download-btn" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Materials;