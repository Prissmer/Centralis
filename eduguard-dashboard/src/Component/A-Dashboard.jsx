import React, { useState, useEffect } from 'react';
import "./Style/A-Dashboard.css";
import { useAuth } from "../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  FaUsers, 
  FaFileAlt, 
  FaCloudUploadAlt, 
  FaPlus, 
  FaSearch, 
  FaCheckCircle, 
  FaClock,
  FaClipboardList,
  FaHistory,
  FaChevronRight
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalMaterials: 0, pendingCount: 0, approvedCount: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [greeting, setGreeting] = useState("");
  const [displayName, setDisplayName] = useState("Admin");

  // Dynamic greeting based on time
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 18) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch display name
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    } else if (user?.user_metadata?.full_name) {
      setDisplayName(user.user_metadata.full_name);
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/dashboard-stats`);
        const data = await res.json();
        if (res.ok) {
          setStats({
            totalUsers: data.totalUsers || 0,
            totalMaterials: data.totalMaterials || 0,
            pendingCount: data.pendingCount || 0,
            approvedCount: data.approvedCount || 0
          });
          setRecentLogs(data.recentLogs || []);
        }
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionBadge = (action) => {
    const a = (action || '').toLowerCase();
    if (a.includes('upload')) return 'success';
    if (a.includes('download')) return 'success';
    if (a.includes('acknowledge')) return 'success';
    if (a.includes('login')) return 'success';
    if (a.includes('delete')) return 'failed';
    return 'success';
  };

  return (
    <div className="dashboard-container" style={{ fontFamily: "'Inter', sans-serif", minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      <main className="dashboard" style={{ minHeight: '100vh' }}>
        
        {/* Header - Matches F-Dashboard */}
        <header className="responsive-header">
          <div className="header-left">
            <h2 style={{
              fontSize: '28px', fontWeight: 700,
              background: 'linear-gradient(135deg, #166534, #14532d)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              color: 'transparent', margin: 0
            }}>Dashboard</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Admin Overview • Real-time system monitoring</p>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', background: 'white',
              border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px',
              minWidth: '320px', transition: 'all 0.2s ease'
            }}>
              <FaSearch style={{ color: '#94a3b8', fontSize: '16px' }} />
              <input type="text" placeholder="Search anything..." style={{
                border: 'none', outline: 'none', background: 'transparent',
                marginLeft: '10px', fontSize: '14px', width: '100%'
              }} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div style={{ marginTop: '90px', padding: '32px' }}>
          
          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
            borderRadius: '24px', padding: '32px 40px', position: 'relative',
            overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
                {greeting}, {displayName} 👋
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: 1.5, maxWidth: '70%' }}>
                You have {stats.pendingCount} submission{stats.pendingCount !== 1 ? 's' : ''} pending review and {stats.totalUsers} registered user{stats.totalUsers !== 1 ? 's' : ''} in the system.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                <button onClick={() => navigate('/checklist')} style={{
                  background: 'white', color: '#166534', padding: '10px 24px',
                  borderRadius: '40px', border: 'none', fontWeight: 600,
                  cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease'
                }}>Review Submissions</button>
                <button onClick={() => navigate('/users')} style={{
                  background: 'rgba(255, 255, 255, 0.15)', color: 'white',
                  padding: '10px 24px', borderRadius: '40px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  fontWeight: 500, cursor: 'pointer', fontSize: '14px'
                }}>Manage Users</button>
              </div>
            </div>
            <div style={{
              position: 'absolute', right: '-20px', top: '-20px',
              width: '200px', height: '200px',
              background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', zIndex: 1
            }}></div>
          </div>

          {/* Stats Grid */}
          <div className="stats-container" style={{ marginTop: '32px' }}>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue"><FaUsers /></div>
                <span className="trend">Active</span>
              </div>
              <p>Total Users</p>
              <h3>{stats.totalUsers.toLocaleString()}</h3>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon purple"><FaCloudUploadAlt /></div>
                <span className="trend">Total</span>
              </div>
              <p>Materials</p>
              <h3>{stats.totalMaterials.toLocaleString()}</h3>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon orange"><FaClock /></div>
                <span className="attention-tag">Needs Review</span>
              </div>
              <p>Pending Review</p>
              <h3>{stats.pendingCount}</h3>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ background: '#f0fdf4', color: '#166534' }}><FaCheckCircle /></div>
                <span className="trend">Acknowledged</span>
              </div>
              <p>Acknowledged</p>
              <h3>{stats.approvedCount}</h3>
            </div>
          </div>

          {/* System Activity + Quick Actions */}
          <div className="middle-section" style={{ marginTop: '32px' }}>
            {/* Recent System Activity */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>Recent System Activity</h3>
                <button onClick={() => navigate('/audit-logs')} style={{
                  background: 'none', border: 'none', color: '#166534',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px',
                  borderRadius: '8px'
                }}>View All <FaChevronRight /></button>
              </div>
              <div style={{ marginTop: '8px' }}>
                {recentLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <FaHistory style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }} />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentLogs.map((log, i) => (
                    <div key={log.log_id || i} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px', borderRadius: '12px',
                      transition: 'all 0.2s ease', cursor: 'pointer',
                      borderBottom: i < recentLogs.length - 1 ? '1px solid #f8fafc' : 'none'
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: '#f0fdf4', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#166534', fontSize: '16px', flexShrink: 0
                      }}>
                        <FaFileAlt />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>
                          {log.user_display_name || 'System'}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.description || log.action}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatTime(log.created_at)}</span>
                        <div style={{ marginTop: '4px' }}>
                          <span className={`badge ${getActionBadge(log.action)}`}>{log.action}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="actions-card">
              <h3>Quick Actions</h3>
              <button className="action-btn green-btn" onClick={() => navigate('/users')}>
                <FaPlus /> Add New User
              </button>
              <button className="action-btn blue-btn" onClick={() => navigate('/checklist')}>
                <FaClipboardList /> Review Submissions
              </button>
              <button className="action-btn gray-btn" onClick={() => navigate('/audit-logs')}>
                <FaHistory /> View Log History
              </button>
              
              <div className="system-status">
                <FaCheckCircle className="status-icon" />
                <div>
                  <p className="status-title">System Operational</p>
                  <p className="status-sub">All services running normally</p>
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