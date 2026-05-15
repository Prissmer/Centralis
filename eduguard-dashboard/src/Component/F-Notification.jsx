import React, { useState } from "react";
import "./Style/F-Notifications.css";
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

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Upload Approved",
      message: "Your OBTLP for Programming 1 has been approved by the department head.",
      time: "2 hours ago",
      timestamp: "2026-04-12T10:30:00",
      type: "success",
      icon: <FaCheck />,
      iconBg: "success",
      borderColor: "success",
      isRead: false,
      isArchived: false,
      actionLink: "/my-uploads"
    },
    {
      id: 2,
      title: "Upload Rejected",
      message: "Module 3 for Data Structures requires revision. Please check comments.",
      time: "1 day ago",
      timestamp: "2026-04-11T15:45:00",
      type: "error",
      icon: <FaTimes />,
      iconBg: "error",
      borderColor: "error",
      isRead: false,
      isArchived: false,
      actionLink: "/my-uploads"
    },
    {
      id: 3,
      title: "Missing Documents",
      message: "You have 2 missing documents for OOP course. Please upload before deadline.",
      time: "2 days ago",
      timestamp: "2026-04-10T09:15:00",
      type: "warning",
      icon: <FaExclamation />,
      iconBg: "warning",
      borderColor: "warning",
      isRead: false,
      isArchived: false,
      actionLink: "/upload"
    },
    {
      id: 4,
      title: "Deadline Reminder",
      message: "Submission deadline for final exam materials is in 3 days.",
      time: "3 days ago",
      timestamp: "2026-04-09T14:20:00",
      type: "info",
      icon: <FaClock />,
      iconBg: "info",
      borderColor: "info",
      isRead: true,
      isArchived: false,
      actionLink: "/upload"
    },
    {
      id: 5,
      title: "New Template Available",
      message: "A new OBTLP template has been added to the templates library.",
      time: "5 days ago",
      timestamp: "2026-04-07T11:00:00",
      type: "info",
      icon: <FaInfoCircle />,
      iconBg: "info",
      borderColor: "info",
      isRead: true,
      isArchived: false,
      actionLink: "/templates"
    },
    {
      id: 6,
      title: "Material Downloaded",
      message: "Your syllabus for Web Development has been downloaded by 15 students.",
      time: "1 week ago",
      timestamp: "2026-04-05T08:30:00",
      type: "success",
      icon: <FaCheckCircle />,
      iconBg: "success",
      borderColor: "success",
      isRead: true,
      isArchived: false,
      actionLink: "/my-uploads"
    },
    {
      id: 7,
      title: "System Update",
      message: "The system will undergo maintenance on April 15, 2026 from 2 AM to 4 AM.",
      time: "1 week ago",
      timestamp: "2026-04-04T16:45:00",
      type: "warning",
      icon: <FaExclamation />,
      iconBg: "warning",
      borderColor: "warning",
      isRead: true,
      isArchived: false,
      actionLink: null
    }
  ]);

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
      prev.map(notif =>
        notif.id === id ? { ...notif, isArchived: true } : notif
      )
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notif => !notif.isArchived);
  };

  const filteredNotifications = getFilteredNotifications();

  const handleNotificationClick = (notification) => {
    if (notification.actionLink) {
      alert(`Navigating to: ${notification.actionLink}\nIn a real app, this would redirect to the appropriate page.`);
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications">
        {/* Header */}
        <div className="notifications-header">
          <div>
            <h2>Notifications</h2>
            <p>Stay updated with your uploads and approvals</p>
          </div>
        </div>

        {/* Content */}
        <div className="notifications-content">
          {/* Notifications List */}
          <div className="notifications-card">
            <div className="notifications-header-section">
              <h3>All Notifications</h3>
              <span className="notifications-count">{filteredNotifications.length} items</span>
            </div>

            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${getBgClass(notification.type)} ${getBorderColorClass(notification.type)}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`notification-icon ${getIconBgClass(notification.iconBg)}`}>
                    {notification.icon}
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-header">
                      <h4>{notification.title}</h4>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                  </div>
                  
                  <div className="notification-actions">
                    <button
                      className="action-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNotification(notification.id);
                      }}
                      title="Archive"
                    >
                      <FaArchive />
                    </button>
                    <button
                      className="action-icon delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}

              {filteredNotifications.length === 0 && (
                <div className="empty-state">
                  <FaBell className="empty-icon" />
                  <h3>No notifications found</h3>
                  <p>You're all caught up! No notifications to display.</p>
                </div>
              )}
            </div>
          </div>

          {/* Archived Section (Optional) */}
          {notifications.some(n => n.isArchived) && (
            <div className="archived-section">
              <div className="archived-header">
                <h3>Archived Notifications</h3>
                <button 
                  className="restore-all-btn"
                  onClick={() => {
                    setNotifications(prev =>
                      prev.map(notif =>
                        notif.isArchived ? { ...notif, isArchived: false } : notif
                      )
                    );
                  }}
                >
                  Restore All
                </button>
              </div>
              <div className="archived-list">
                {notifications.filter(n => n.isArchived).slice(0, 3).map((notification) => (
                  <div key={`archived-${notification.id}`} className="archived-item">
                    <div className={`notification-icon ${getIconBgClass(notification.iconBg)}`}>
                      {notification.icon}
                    </div>
                    <div className="archived-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                    </div>
                    <button
                      className="restore-btn"
                      onClick={() => {
                        setNotifications(prev =>
                          prev.map(notif =>
                            notif.id === notification.id ? { ...notif, isArchived: false } : notif
                          )
                        );
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
                {notifications.filter(n => n.isArchived).length > 3 && (
                  <button className="view-all-archived">
                    View all archived ({notifications.filter(n => n.isArchived).length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;