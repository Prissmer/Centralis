import React from "react";
import { useAuth } from "./Context/AuthContext";
import Login from "./login-module/Login";
import AdminApp from "./admin-module/A-App";
import FacultyApp from "./faculty-module/F-App";
import UpdatePassword from "./login-module/UpdatePassword";

function App() {
  const { user, loading, signOut } = useAuth();

  // Show nothing (or a tiny spinner) while checking the token
  if (loading) return null;

  // Handle password reset pages
  const isPasswordPage = window.location.pathname === "/update-password";
  if (isPasswordPage) return <UpdatePassword />;

  // If no session is found, show Login
  if (!user) return <Login />;

  // ROLE-BASED ROUTING (Instant via Metadata)
  // We check both user.role and user.user_metadata.role for safety
  const role = user.role || user.user_metadata?.role;

  if (role === "admin" || role === "super_admin") {
    return <AdminApp />;
  }

  if (["instructor", "lead_instructor", "faculty"].includes(role)) {
    return <FacultyApp />;
  }

  // Fallback: If logged in but role is missing from metadata
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'sans-serif' 
    }}>
      <h2>Role Not Assigned</h2>
      <p>Logged in as: <b>{user.email}</b></p>
      <p style={{ color: '#666' }}>Your account metadata is missing a role.</p>
      <button 
        onClick={() => signOut()} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          background: '#dc2626', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer' 
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default App;