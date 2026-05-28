import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom"; // 🔥 NEW: Import navigation hook
import "./Style/F-Notifications.css";
import { FaCheck, FaTimes, FaExclamation, FaClock, FaBell, FaTrash, FaArchive, FaInfoCircle, FaCalendarAlt } from "react-icons/fa";

const socket = io("http://localhost:5000");

const Notifications = () => {
  const navigate = useNavigate(); // 🔥 NEW: Initialize navigation

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

  useEffect(() => {
    socket.on("admin_notification", (data) => {
      console.log("🔔 Live Webhook Received!", data);

      let notifType = "info";
      let targetLink = "/"; // Default fallback
      
      // 🔥 SMART ROUTING LOGIC
      if (data.type === "NEW_DEADLINE") {
        notifType = "warning";
        targetLink = "/requirements"; // You can append ?tab=data.category if your UI supports URL tabs
      } else if (data.type === "NEW_REQUIREMENT") {
        notifType = "info";
        targetLink = "/requirements";
      } else if (data.type === "APPROVAL") {
        notifType = "success"; 
        targetLink = "/my-uploads"; // Redirects to uploads for approvals
      } else if (data.type === "REJECTION") {
        notifType = "error"; 
        targetLink = "/my-uploads"; // Redirects to uploads for rejections
      }

      const newNotification = {
        id: `live-${Date.now()}`, 
        title: data.title,
        message: data.message,
        time: "Just now", 
        timestamp: new Date().toISOString(),
        type: notifType,
        iconBg: notifType,
        borderColor: notifType,
        isRead: false,
        isArchived: false,
        isNew: true, 
        actionLink: targetLink // 🔥 Saves the specific route
      };

      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => socket.off("admin_notification");
  }, []);

  // ... (keep renderIcon, getIconBgClass, etc. exactly the same)

  // 🔥 FIX 2: Save to Local Storage whenever notifications change
  useEffect(() => {
    localStorage.setItem("faculty_notifications_v2", JSON.stringify(notifications));
  }, [notifications]);

  // 🔥 THE MAGIC: Listen for real-time WebSockets
  useEffect(() => {
    socket.on("admin_notification", (data) => {
      console.log("🔔 Live Webhook Received!", data);

      let notifType = "info";
      
      if (data.type === "NEW_DEADLINE") {
        notifType = "warning";
      } else if (data.type === "NEW_REQUIREMENT") {
        notifType = "info";
      } else if (data.type === "APPROVAL") {
        notifType = "success"; 
      } else if (data.type === "REJECTION") {
        notifType = "error"; 
      }

      // Create the new notification object (No React Elements!)
      const newNotification = {
        id: `live-${Date.now()}`, 
        title: data.title,
        message: data.message,
        time: "Just now", 
        timestamp: new Date().toISOString(),
        type: notifType,
        iconBg: notifType,
        borderColor: notifType,
        isRead: false,
        isArchived: false,
        isNew: true, 
        actionLink: "/my-uploads" 
      };

      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socket.off("admin_notification");
    };
  }, []);

  // 🔥 FIX 3: A helper function that safely draws the icon during render
  const renderIcon = (type) => {
    switch(type) {
      case 'success': return <FaCheck />;
      case 'error': return <FaTimes />;
      case 'warning': return <FaCalendarAlt />;
      case 'info': return <FaBell />;
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

  const archiveNotification = (id) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, isArchived: true } : notif)
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => !notif.isArchived);

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
              <h3>Active Inbox</h3>
              <span className="notifications-count">{filteredNotifications.length} items</span>
            </div>

            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${getBgClass(notification.type)} ${getBorderColorClass(notification.type)} ${notification.isNew ? 'slide-in-anim' : ''}`}
                  // 🔥 NEW: Actually navigate the user to the correct page!
                  onClick={() => {
                    if (notification.actionLink) {
                      navigate(notification.actionLink);
                    }
                  }}
                >
                  <div className={`notification-icon ${getIconBgClass(notification.iconBg)}`}>
                    {/* 🔥 Call the helper function here instead of reading from state */}
                    {renderIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4 style={{ fontWeight: notification.isRead ? '500' : '700' }}>
                        {notification.title}
                        {!notification.isRead && <span className="unread-dot"></span>}
                      </h4>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
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
                  <h3>No notifications found</h3>
                  <p>You're all caught up! Waiting for live updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;