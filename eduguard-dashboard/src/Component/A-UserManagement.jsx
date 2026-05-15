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
      <header className="global-header">
        <h2>User Management</h2>
        <div className="header-right">
          <div className="global-search">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="notification-bell">
            <FaBell />
            <span className="badge"></span>
          </div>
        </div>
      </header>

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
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
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
            {filteredUsers.map((user) => {
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
                    <span className={"role-badge " + (user.role || "").toLowerCase()}>
                      {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "No Role"}
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

        {/* PAGINATION FOOTER */}
        <div className="pagination-container">
          <span className="entries-info">
            Showing 1 to {filteredUsers.length} of {users.length} entries
          </span>
          <div className="pagination-controls">
            <button className="page-btn">Prev</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">Next</button>
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
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>

            <div className="modal-actions">
              <button className="modal-confirm-btn" onClick={createUser}>Send Invite</button>
              <button className="modal-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;