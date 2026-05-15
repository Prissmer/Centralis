import React, { useState } from 'react';
import "./Login.css";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

import { loginUser } from './loginService';
import { getUserRole } from './auth';
import { useAuth } from '../Context/AuthContext';

const Login = () => {
  const { setUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  // ✅ NEW STATES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ HANDLE LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await loginUser(email, password);

      console.log("AUTH USER ID:", res.user.id);

      const userId = res.user.id;

      const role = await getUserRole(userId);

      setUser({
        id: userId,
        email,
        role,
      });

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-page-container">
      
      {/* Brand Section */}
      <div className="login-brand-side">
        <div className="brand-overlay"></div>
        <div className="brand-content">
          <div className="brand-logo">C</div>
          <h1>CENTRALIS</h1>
          <p>The next generation of academic integrity and material management.</p>
        </div>
        <div className="brand-footer">
          <p>© 2026 Centralis Systems Inc.</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="login-form-side">
        <div className="login-box">
          <h2>Welcome Back</h2>
          <p className="sub-text">Please enter your details to sign in.</p>

          {/* ✅ CONNECT FORM */}
          <form className="auth-form" onSubmit={handleSubmit}>
            
            {/* EMAIL */}
            <div className="input-field">
              <label>Email Address</label>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />
                <input 
                  type="email" 
                  placeholder="admin@eduguard.edu" 
                  required 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="input-field">
              <label>Password</label>
              <div className="input-wrapper">
                <FaLock className="input-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  required 
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember for 30 days</span>
              </label>
              <a href="#forgot" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-submit-btn">
              Sign In
            </button>

          </form>

          <p className="footer-note">
            Don't have an account? <span className="contact-admin">Contact System Admin</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;