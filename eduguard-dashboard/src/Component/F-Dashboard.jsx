import React, { useState, useEffect } from "react";
import "./Style/F-Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  FaSearch,
  FaBookOpen,
  FaCloudUploadAlt,
  FaClock,
  FaCheckCircle,
  FaFilePdf,
  FaFileWord,
  FaDownload,
  FaChevronRight,
  FaClipboardList,
  FaExclamationCircle,
  FaCalendarDay
} from "react-icons/fa";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [displayName, setDisplayName] = useState("User");
  const [stats, setStats] = useState({ courses: 0, uploads: 0, pending: 0, compliance: 0 });
  const [recentDownloads, setRecentDownloads] = useState([]);
  const [pendingRequirements, setPendingRequirements] = useState([]);

  // Dynamic greeting
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

  // Get display name
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    } else if (user?.user_metadata?.first_name) {
      setDisplayName(`${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim());
    } else if (user?.email) {
      setDisplayName(user.email.split('@')[0]);
    }
  }, [user]);

  // Fetch stats from Supabase
  useEffect(() => {
    if (!user) return;
    const fetchDashboardData = async () => {
      try {
        // User's total uploads
        const { count: uploadCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('uploaded_by', user.id);

        const { data: reqs } = await supabase.from('requirements').select('*').eq('active', true);
        const { data: subs } = await supabase
          .from('submissions')
          .select('requirement_id')
          .eq('uploaded_by', user.id);

        const assignedReqs = (reqs || []).filter(req => {
          const isRoleAssigned = !req.assigned_roles || req.assigned_roles.length === 0 || req.assigned_roles.includes(user.role);
          const isUserAssigned = req.assigned_users && req.assigned_users.includes(user.id);
          return isRoleAssigned || isUserAssigned;
        });

        const submittedIds = new Set((subs || []).map(s => s.requirement_id));
        const pendingReqs = assignedReqs.filter(r => !submittedIds.has(r.requirement_id));
        
        let dueTodayCount = 0;
        let overdueCount = 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const todayZero = new Date(new Date().setHours(0,0,0,0));

        pendingReqs.forEach(req => {
          if (req.due_date) {
            const isOverdue = new Date(req.due_date) < new Date();
            const dueStr = new Date(req.due_date).toISOString().split('T')[0];
            const isDueToday = !isOverdue && dueStr === todayStr;
            
            if (isOverdue) {
              overdueCount++;
            } else if (isDueToday) {
              dueTodayCount++;
            }
          }
        });

        const totalReqs = assignedReqs.length;
        const complianceRate = totalReqs > 0 ? Math.round(((totalReqs - pendingReqs.length) / totalReqs) * 100) : 0;

        setStats({
          courses: 0,
          uploads: uploadCount || 0,
          pending: pendingReqs.length,
          compliance: complianceRate,
          dueToday: dueTodayCount,
          overdue: overdueCount
        });

        setPendingRequirements(pendingReqs.slice(0, 3));

        // Recent downloads
        const { data: downloads } = await supabase
          .from('downloads')
          .select('*')
          .eq('user_id', user.id)
          .order('downloaded_at', { ascending: false })
          .limit(3);

        setRecentDownloads(downloads || []);
      } catch (err) {
        console.error("Dashboard data error:", err);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
              <h3>{greeting}, {displayName} 👋</h3>
              <p>
                You have {stats.pending} pending requirement{stats.pending !== 1 ? 's' : ''} and your compliance is at {stats.compliance}%.
              </p>
              <div className="banner-buttons">
                <button className="primary-btn" onClick={() => navigate('/requirement')}>View Requirements</button>
                <button className="secondary-btn" onClick={() => navigate('/notifications')}>View Notifications</button>
              </div>
            </div>
            <div className="banner-decoration"></div>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="card">
              <div className="card-icon-wrapper" style={{background: '#f1f5f9'}}>
                <FaBookOpen className="card-icon" style={{color: '#475569'}} />
              </div>
              <div className="card-content">
                <h4>{stats.pending}</h4>
                <p>Pending Requirements</p>
              </div>
            </div>

            <div className="card">
              <div className="card-icon-wrapper">
                <FaCalendarDay className="card-icon" style={{color: '#ea580c'}} />
              </div>
              <div className="card-content">
                <h4>{stats.dueToday}</h4>
                <p>Due Today</p>
              </div>
            </div>

            <div className="card">
              <div className="card-icon-wrapper" style={{background: '#fee2e2'}}>
                <FaExclamationCircle className="card-icon" style={{color: '#dc2626'}} />
              </div>
              <div className="card-content">
                <h4>{stats.overdue}</h4>
                <p style={{color: '#dc2626', fontWeight: '600'}}>Overdue</p>
              </div>
            </div>
            
            <div className="card">
              <div className="card-icon-wrapper" style={{background: '#e0f2fe'}}>
                <FaCloudUploadAlt className="card-icon" style={{color: '#0284c7'}} />
              </div>
              <div className="card-content">
                <h4>{stats.uploads}</h4>
                <p>Materials Uploaded</p>
              </div>
            </div>

            <div className="card">
              <div className="card-icon-wrapper">
                <FaCheckCircle className="card-icon" />
              </div>
              <div className="card-content">
                <h4>{stats.compliance}%</h4>
                <p>Compliance Rate</p>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="bottom-grid">
            {/* Recent Downloads */}
            <div className="recent">
              <div className="section-header">
                <h3>Recent Downloads</h3>
                <button className="view-all-btn" onClick={() => navigate('/my-downloads')}>View All <FaChevronRight /></button>
              </div>

              {recentDownloads.length === 0 ? (
                <p style={{ color: '#64748b', padding: '16px', textAlign: 'center' }}>No recent downloads</p>
              ) : (
                recentDownloads.map((dl, i) => (
                  <div className="recent-item" key={dl.id || i}>
                    {(dl.file_type || '').includes('pdf') ? <FaFilePdf className="file-icon pdf" /> : <FaFileWord className="file-icon word" />}
                    <div className="item-info">
                      <p>{dl.file_name}</p>
                      <span>{new Date(dl.downloaded_at).toLocaleDateString()}</span>
                    </div>
                    <FaDownload className="download-icon" />
                  </div>
                ))
              )}
            </div>

            {/* Pending Requirements */}
            <div className="pending">
              <div className="section-header">
                <h3>Pending Requirements</h3>
                <button className="view-all-btn" onClick={() => navigate('/requirement')}>View All <FaChevronRight /></button>
              </div>

              {pendingRequirements.length === 0 ? (
                <p style={{ color: '#64748b', padding: '16px', textAlign: 'center' }}>All caught up! ✅</p>
              ) : (
                pendingRequirements.map((req, i) => (
                  <div className="pending-item" key={req.requirement_id || i}>
                    <div className="pending-status waiting"></div>
                    <div className="pending-info">
                      <p>{req.requirement_name}</p>
                      <span>{(req.category || '').replace('_', ' ')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;