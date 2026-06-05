import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { supabase } from "../lib/supabase";
import "./Style/F-Notifications.css";
import { 
  FaCheck, FaTimes, FaExclamation, FaClock, FaBell, FaTrash, 
  FaArchive, FaInfoCircle, FaCalendarAlt, FaClipboardList,
  FaExclamationTriangle, FaFileAlt, FaChevronRight, FaChevronLeft
} from "react-icons/fa";

const socket = io("http://localhost:5000");

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("faculty_notifications_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("faculty_notifications_v2", JSON.stringify(notifications));
  }, [notifications]);

  // Check for deadlines due today on mount
  useEffect(() => {
    if (!user) return;
    const checkDeadlines = async () => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const { data: reqs } = await supabase
          .from('requirements')
          .select('*')
          .eq('active', true);

        if (!reqs) return;

        // Collect all deadline notifications to add at once
        const newDeadlineNotifs = [];
        reqs.forEach(req => {
          const isRoleAssigned = !req.assigned_roles || req.assigned_roles.length === 0 || req.assigned_roles.includes(user.role);
          const isUserAssigned = req.assigned_users && req.assigned_users.includes(user.id);
          if (!isRoleAssigned && !isUserAssigned) return;

          if (!req.due_date) return;
          const dueDate = new Date(req.due_date);
          const dueDateStr = dueDate.toISOString().split('T')[0];
          
          if (dueDateStr === todayStr) {
            const deadlineId = `deadline-${req.requirement_id}-${todayStr}`;
            const deadlineTime = dueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            newDeadlineNotifs.push({
              id: deadlineId,
              title: "⏰ Deadline Today!",
              message: `"${req.requirement_name}" in ${(req.category || '').replace('_', ' ')} is due today at ${deadlineTime}. Submit now to avoid being marked overdue.`,
              time: "Just now",
              timestamp: new Date().toISOString(),
              type: "warning",
              iconBg: "warning",
              borderColor: "warning",
              isRead: false,
              isArchived: false,
              isNew: true,
              actionLink: "/requirement",
              deadlineReqId: req.requirement_id,
              deadlineDate: todayStr,
              details: {
                requirement: req.requirement_name,
                category: (req.category || '').replace('_', ' '),
                dueDate: dueDate.toLocaleString()
              }
            });
          }
        });

        if (newDeadlineNotifs.length > 0) {
          setNotifications(prev => {
            // Filter out any that already exist in prev
            const existingIds = new Set(prev.map(n => n.id));
            const toAdd = newDeadlineNotifs.filter(n => !existingIds.has(n.id));
            if (toAdd.length === 0) return prev;
            return [...toAdd, ...prev];
          });
        }
      } catch (err) {
        console.error("Deadline check error:", err);
      }
    };
    checkDeadlines();
  }, [user]);

  const userRef = useRef(user?.id);
  const roleRef = useRef(user?.role);
  useEffect(() => {
    userRef.current = user?.id;
    roleRef.current = user?.role;
  }, [user]);

  // Auto-mark all notifications as read when visiting this page
  useEffect(() => {
    setNotifications(prev => {
      const hasUnread = prev.some(n => !n.isRead);
      if (!hasUnread) return prev;
      return prev.map(n => ({ ...n, isRead: true, isNew: false }));
    });
  }, []);

  // Live socket notifications
  useEffect(() => {
    const handler = (data) => {
      console.log("🔔 Live Webhook Received!", data);

      if (data.target_user_id && data.target_user_id !== userRef.current) {
        return; // Ignore notifications meant for other users
      }

      // 1. Assignment check for single requirements
      if (data.assigned_roles || data.assigned_users) {
        const isRoleAssigned = !data.assigned_roles || data.assigned_roles.length === 0 || data.assigned_roles.includes(roleRef.current);
        const isUserAssigned = data.assigned_users && data.assigned_users.includes(userRef.current);
        if (!isRoleAssigned && !isUserAssigned) {
          console.log("Ignored notification: Requirement not assigned to this user/role.");
          return;
        }
      }

      // 2. Assignment check for bulk-deadline updates
      if (data.type === "NEW_DEADLINE" && data.assignedItems) {
        // Filter the assignedItems to see if ANY are assigned to this user
        const assignedToMe = data.assignedItems.filter(req => {
          const isRoleAssigned = !req.assigned_roles || req.assigned_roles.length === 0 || req.assigned_roles.includes(roleRef.current);
          const isUserAssigned = req.assigned_users && req.assigned_users.includes(userRef.current);
          return isRoleAssigned || isUserAssigned;
        });

        if (assignedToMe.length === 0) {
          console.log("Ignored bulk deadline update: No items assigned to this user.");
          return;
        }

        // If partially assigned, update the message to reflect only what they care about
        if (assignedToMe.length < data.assignedItems.length) {
          data.requirementNames = assignedToMe.map(r => r.requirement_name).join(', ');
          data.message = `The admin has set new deadlines for: ${data.requirementNames}. Due date: ${data.date ? new Date(data.date).toLocaleString() : 'Not set'}.`;
        }
      }

      let notifType = "info";
      let targetLink = "/";
      let title = data.title;
      let message = data.message;
      let details = {};
      
      if (data.type === "NEW_DEADLINE") {
        notifType = "warning";
        targetLink = "/requirement";
        title = "📅 Deadline Updated";
        details = {
          requirement: data.requirementNames || 'Multiple requirements',
          category: data.category ? data.category.replace('_', ' ') : 'requirements',
          dueDate: data.date ? new Date(data.date).toLocaleString() : 'Not specified'
        };
      } else if (data.type === "NEW_REQUIREMENT_WITH_DEADLINE") {
        notifType = "warning";
        targetLink = "/requirement";
        title = "📋 New Requirement Added";
        details = {
          requirement: data.requirementName || 'N/A',
          category: data.category ? data.category.replace('_', ' ') : 'N/A',
          dueDate: data.dueDate ? new Date(data.dueDate).toLocaleString() : 'Not specified'
        };
      } else if (data.type === "NEW_REQUIREMENT") {
        notifType = "info";
        targetLink = "/requirement";
        title = "📋 New Requirement Added";
        details = {
          requirement: data.requirementName || 'N/A',
          category: data.category ? data.category.replace('_', ' ') : 'N/A'
        };
      } else if (data.type === "REQUIREMENT_ASSIGNED") {
        notifType = "info";
        targetLink = "/requirement";
        title = "📋 Requirement Assigned To You";
        details = {
          requirement: data.requirementName || 'N/A',
          category: data.category ? data.category.replace('_', ' ') : 'N/A',
          dueDate: data.dueDate ? new Date(data.dueDate).toLocaleString() : 'Not specified'
        };
      } else if (data.type === "ACKNOWLEDGMENT") {
        notifType = "success"; 
        targetLink = "/materials";
        title = "✅ Document Acknowledged";
      }

      const newId = `live-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newNotification = {
        id: newId, 
        title: title,
        message: message,
        time: getRelativeTime(new Date()),
        timestamp: new Date().toISOString(),
        type: notifType,
        iconBg: notifType,
        borderColor: notifType,
        isRead: false,
        isArchived: false,
        isNew: true, 
        actionLink: targetLink,
        details: details
      };

      setNotifications((prev) => {
        // Prevent duplicate if same message received within 2 seconds
        const recentDup = prev.find(n => 
          n.title === title && n.message === message && 
          (Date.now() - new Date(n.timestamp).getTime()) < 2000
        );
        if (recentDup) return prev;
        return [newNotification, ...prev];
      });
    };

    socket.on("admin_notification", handler);
    return () => socket.off("admin_notification", handler);
  }, []);

  // Update relative times periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => prev.map(n => ({
        ...n,
        time: getRelativeTime(new Date(n.timestamp))
      })));
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Helper: relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderIcon = (type) => {
    switch(type) {
      case 'success': return <FaCheck />;
      case 'error': return <FaTimes />;
      case 'warning': return <FaCalendarAlt />;
      case 'info': return <FaClipboardList />;
      default: return <FaInfoCircle />;
    }
  };

  const getIconBgClass = (bg) => {
    switch(bg) {
      case 'success': return 'icon-bg-success';
      case 'error': return 'icon-bg-error';
      case 'warning': return 'icon-bg-warning';
      case 'info': return 'icon-bg-info';
      default: return 'icon-bg-info';
    }
  };

  const getBorderColorClass = (color) => {
    switch(color) {
      case 'success': return 'border-success';
      case 'error': return 'border-error';
      case 'warning': return 'border-warning';
      case 'info': return 'border-info';
      default: return '';
    }
  };

  const getBgClass = (color) => {
    switch(color) {
      case 'success': return 'bg-success-light';
      case 'error': return 'bg-error-light';
      case 'warning': return 'bg-warning-light';
      case 'info': return 'bg-info-light';
      default: return '';
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, isRead: true, isNew: false } : notif)
    );
  };

  const archiveNotification = (id) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, isArchived: true } : notif)
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    if (window.confirm("Clear all notifications?")) {
      setNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter(notif => !notif.isArchived);
  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
  const [notifPage, setNotifPage] = useState(1);
  const notifLimit = 10;
  const notifTotalPages = Math.ceil(filteredNotifications.length / notifLimit);
  const paginatedNotifications = filteredNotifications.slice((notifPage - 1) * notifLimit, notifPage * notifLimit);

  return (
    <div className="notifications-container">
      <div className="notifications">
        <div className="notifications-header">
          <div>
            <h2>Faculty Alerts & Updates</h2>
            <p>Real-time updates from Centralis Administration</p>
          </div>
        </div>

        <div className="notifications-content">
          <div className="notifications-card">
            <div className="notifications-header-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3>Active Inbox</h3>
                {unreadCount > 0 && (
                  <span style={{
                    background: '#166534', color: 'white', fontSize: '11px',
                    fontWeight: 700, padding: '2px 8px', borderRadius: '12px'
                  }}>{unreadCount} new</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="notifications-count">{filteredNotifications.length} items</span>
                {filteredNotifications.length > 0 && (
                  <button onClick={clearAll} style={{
                    background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '4px 10px', fontSize: '12px', color: '#64748b', cursor: 'pointer'
                  }}>Clear All</button>
                )}
              </div>
            </div>

            <div className="notifications-list">
              {paginatedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${getBgClass(notification.type)} ${getBorderColorClass(notification.type)} ${notification.isNew ? 'slide-in-anim' : ''}`}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.actionLink) {
                      navigate(notification.actionLink);
                    }
                  }}
                  style={{ opacity: notification.isRead ? 0.75 : 1 }}
                >
                  <div className={`notification-icon ${getIconBgClass(notification.iconBg)}`}>
                    {renderIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content" style={{ flex: 1 }}>
                    <div className="notification-header">
                      <h4 style={{ fontWeight: notification.isRead ? '500' : '700' }}>
                        {notification.title}
                        {!notification.isRead && <span className="unread-dot"></span>}
                      </h4>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    
                    <p className="notification-message">{notification.message}</p>
                    
                    {/* Rich Details Section */}
                    {notification.details && Object.keys(notification.details).length > 0 && (
                      <div style={{
                        marginTop: '10px', padding: '10px 14px',
                        background: 'rgba(255,255,255,0.6)', borderRadius: '10px',
                        border: '1px solid rgba(0,0,0,0.04)', fontSize: '12px'
                      }}>
                        {notification.details.requirement && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ color: '#64748b', minWidth: '80px' }}>Requirement:</span>
                            <span style={{ color: '#1e293b', fontWeight: 600 }}>{notification.details.requirement}</span>
                          </div>
                        )}
                        {notification.details.category && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ color: '#64748b', minWidth: '80px' }}>Category:</span>
                            <span style={{
                              background: '#f0fdf4', color: '#166534',
                              padding: '1px 8px', borderRadius: '8px', fontWeight: 500,
                              textTransform: 'capitalize'
                            }}>{notification.details.category}</span>
                          </div>
                        )}
                        {notification.details.dueDate && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ color: '#64748b', minWidth: '80px' }}>Due Date:</span>
                            <span style={{ color: '#ea580c', fontWeight: 600 }}>{notification.details.dueDate}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action link hint */}
                    {notification.actionLink && (
                      <div style={{
                        marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '12px', color: '#166534', fontWeight: 500
                      }}>
                        Click to view <FaChevronRight style={{ fontSize: '10px' }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="notification-actions">
                    <button className="action-icon" onClick={(e) => { e.stopPropagation(); archiveNotification(notification.id); }} title="Archive">
                      <FaArchive />
                    </button>
                    <button className="action-icon delete" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}

              {filteredNotifications.length === 0 && (
                <div className="empty-state">
                  <FaBell className="empty-icon" />
                  <h3>All caught up!</h3>
                  <p>No pending notifications. We'll notify you when something needs your attention.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {notifTotalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: '1px solid #f0f2f5' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Showing {Math.min(notifLimit, filteredNotifications.length - (notifPage - 1) * notifLimit)} of {filteredNotifications.length} notifications</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => setNotifPage(p => Math.max(1, p - 1))} disabled={notifPage <= 1}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: notifPage <= 1 ? '#f1f5f9' : 'white', cursor: notifPage <= 1 ? 'not-allowed' : 'pointer' }}>
                    <FaChevronLeft />
                  </button>
                  <span style={{ fontSize: '13px', color: '#475569' }}>Page {notifPage} of {notifTotalPages}</span>
                  <button onClick={() => setNotifPage(p => Math.min(notifTotalPages, p + 1))} disabled={notifPage >= notifTotalPages}
                    style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: notifPage >= notifTotalPages ? '#f1f5f9' : 'white', cursor: notifPage >= notifTotalPages ? 'not-allowed' : 'pointer' }}>
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;