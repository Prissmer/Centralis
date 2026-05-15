import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Ensure you have react-icons installed

const UpdatePassword = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ State for visibility
  const [employment_status, setEmploymentStatus] = useState('Regular'); 
  const [specialization, setSpecialization] = useState('Web/Game Development');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Verification failed. Please use the invite link again.");

      // 1. Update Auth Password
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (authError) throw authError;

      // 2. Update Profile Table (Sync with your new schema)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          display_name: displayName,
          employment_status: employment_status, 
          specialization: specialization,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setMessage("✅ Account setup complete! Redirecting...");
      setTimeout(() => { window.location.href = "/"; }, 2000);

    } catch (error) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <h2>Welcome to CENTRALIS</h2>
          <p>Complete your profile to finalize your account setup.</p>
        </div>

        <form onSubmit={handleUpdateAccount} className="setup-form">
          <div className="form-row">
            <div className="input-group">
              <label>First Name</label>
              <input 
                type="text" 
                placeholder="John" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required 
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input 
                type="text" 
                placeholder="Doe" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Display Name</label>
            <input 
              type="text" 
              placeholder="e.g. Prof. John" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required 
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Employment Status</label>
              <select value={employment_status} onChange={(e) => setEmploymentStatus(e.target.value)}>
                <option value="Regular">Regular</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
            <div className="input-group">
              <label>Specialization</label>
              <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}>
                <option value="Web/Game Development">Web/Game Development</option>
                <option value="Software Development">Software Development</option>
                <option value="Networking & Security">Networking & Security</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>
          </div>

          {/* Password with Show/Hide Toggle */}
          <div className="input-group">
            <label>New Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Min. 6 characters" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
                minLength="6"
              />
              <button 
                type="button" 
                className="toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : 'Complete Setup'}
          </button>
        </form>

        {message && (
          <div className={`status-message ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <style jsx>{`
        /* ... existing styles ... */
        .password-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-wrapper input {
          width: 100%;
          padding-right: 45px; /* Space for the eye icon */
        }

        .toggle-eye {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          padding: 8px;
        }

        .toggle-eye:hover {
          color: #14532d;
        }

        /* Re-including core responsive styles for clarity */
        .setup-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background-color: #f8fafc; font-family: 'Inter', sans-serif; }
        .setup-card { width: 100%; max-width: 600px; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .setup-form { display: flex; flex-direction: column; gap: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        input, select { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 1rem; }
        .submit-btn { padding: 14px; background-color: #14532d; color: white; border-radius: 10px; font-weight: 700; cursor: pointer; }
        @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default UpdatePassword;