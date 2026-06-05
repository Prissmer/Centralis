import React, { useState, useEffect } from 'react';
import "./Style/A-UserManagement.css";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaEdit,
  FaBell
} from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("instructor");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ FETCH USERS
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ CREATE USER (REVISED FOR EMAIL INVITE)
  const createUser = async () => {
    try {
      const res = await fetch("http://localhost:5000/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: newEmail,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // ✅ INFORM THE ADMIN THAT THE EMAIL WAS SENT
      alert(`✅ Success! An invitation email has been sent to ${newEmail}.`);

      setShowModal(false);
      setNewEmail("");
      fetchUsers(); // Refresh the list

    } catch (err) {
      alert("❌ " + err.message);
    }
  };

  // ✅ DELETE USER
  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await fetch(`http://localhost:5000/users/${id}`, {
        method: "DELETE",
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ SEARCH & ROLE FILTER LOGIC
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || (user.role || "").toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management-content">

      {/* TOP NAVIGATION HEADER */}
      <header className="responsive-header">
        <div className="header-left">
          <h2 style={{
            fontSize: '28px', fontWeight: 700,
            background: 'linear-gradient(135deg, #166534, #14532d)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            color: 'transparent', margin: 0
          }}>User Management</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Manage system access and roles</p>
        </div>
        <div className="header-right" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', background: 'white',
            border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 16px',
            minWidth: '320px', transition: 'all 0.2s ease'
          }}>
            <FaSearch style={{ color: '#94a3b8', fontSize: '16px' }} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                marginLeft: '10px', fontSize: '14px', width: '100%'
              }}
            />
          </div>
          <div className="notification-bell" style={{ marginLeft: '15px' }}>
            <FaBell />
            <span className="badge"></span>
          </div>
        </div>
      </header>

      <div style={{ marginTop: '90px' }}>

      <div className="table-container-card">

        {/* TABLE CONTROLS */}
        <div className="table-controls">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="controls-right">
            <select 
              className="role-filter" 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All Roles">All Roles</option>
              <option value="admin">Admin</option>
              <option value="instructor">Instructor</option>
              <option value="lead_instructor">Lead Instructor</option>
            </select>

            <button 
              className="add-user-btn"
              onClick={() => setShowModal(true)}
            >
              <FaPlus /> Add User
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <table className="user-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>LAST ACTIVE</th>
              <th>ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((user) => {
              const displayName = user.display_name || user.email?.split('@')[0] || "Unknown User";
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="avatar">{initial}</div>
                      <div className="user-info">
                        <span className="user-name">{displayName}</span>
                        <span className="user-email">{user.email || "No Email"}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className={"role-badge " + (user.role || "").toLowerCase().replace(' ', '_')}>
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ') : "No Role"}
                    </span>
                  </td>

                  <td>
                    <label className="switch">
                      <input type="checkbox" defaultChecked={user.status !== 'inactive'} />
                      <span className="slider round"></span>
                    </label>
                  </td>

                  <td className="text-muted">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : "Pending Invite"}
                  </td>

                  <td>
                    <div className="action-buttons">
                      <FaEdit className="edit-icon" />
                      <FaTrash
                        className="delete-icon"
                        onClick={() => deleteUser(user.id)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="pagination-container">
          <span className="entries-info">
            Showing {Math.min((page - 1) * itemsPerPage + 1, filteredUsers.length)} to {Math.min(page * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} entries
          </span>
          <div className="pagination-controls">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
            {Array.from({ length: Math.ceil(filteredUsers.length / itemsPerPage) }, (_, i) => (
              <button key={i + 1} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="page-btn" disabled={page >= Math.ceil(filteredUsers.length / itemsPerPage)} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Invite New User</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
              An invitation email will be sent to the user to set up their account.
            </p>

            <input
              type="email"
              placeholder="Enter user email (e.g., user@gmail.com)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />

            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="instructor">Instructor</option>
              <option value="lead_instructor">Lead Instructor</option>
              <option value="admin">Admin</option>
            </select>

            <div className="modal-actions">
              <button className="modal-confirm-btn" onClick={createUser}>Send Invite</button>
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default UserManagement;