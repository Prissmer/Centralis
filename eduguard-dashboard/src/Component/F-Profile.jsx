import React, { useState, useEffect } from "react";
import "./Style/F-Profile.css";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Context/AuthContext.jsx";

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    specialization: "",
    department: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // 1. Fetch user data from Supabase on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          const [first, ...last] = (data.display_name || "").split(" ");
          setFormData((prev) => ({
            ...prev,
            firstName: first || "",
            lastName: last.join(" ") || "",
            email: user.email || "",
            specialization: data.specialization || "",
            department: data.department || "Computer Science Department",
            phone: data.phone || "+1 (555) 000-0000"
          }));
        }
      } catch (error) {
        console.error("Error fetching profile:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 2. Update Profile Data in 'profiles' table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: `${formData.firstName} ${formData.lastName}`,
          specialization: formData.specialization,
          department: formData.department,
          phone: formData.phone
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 3. Handle Password Change (Optional)
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          alert("New passwords do not match!");
          setLoading(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (passwordError) throw passwordError;
      }

      alert("Profile updated successfully!");
    } catch (error) {
      alert("Error updating profile: " + error.message);
    } finally {
      setLoading(false);
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    }
  };

  if (loading) return <div className="loading-container">Loading Profile...</div>;

  return (
    <div className="profile-page-wrapper">
      <div className="profile-page-grid">
        {/* Profile Card (Left Side) */}
        <div className="profile-info-card">
          <div className="profile-info-card-inner">
            <div className="profile-image-wrapper">
              <img 
                src={`https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=1B5E20&color=fff&size=200`} 
                alt="Profile" 
                className="profile-user-image"
              />
            </div>
            <h3 className="profile-user-name">{formData.firstName} {formData.lastName}</h3>
            <p className="profile-user-role">{['instructor', 'lead_instructor'].includes(user?.role) ? 'Faculty Member' : 'Admin'}</p>
            
            <div className="profile-info-box">
              <div className="profile-info-item">
                <i className="fas fa-building"></i>
                <span>{formData.department}</span>
              </div>
              <div className="profile-info-item">
                <i className="fas fa-graduation-cap"></i>
                <span>{formData.specialization}</span>
              </div>
              <div className="profile-info-item">
                <i className="fas fa-envelope"></i>
                <span>{formData.email}</span>
              </div>
              <div className="profile-info-item">
                <i className="fas fa-phone"></i>
                <span>{formData.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile (Right Side) */}
        <div className="profile-edit-section">
          <div className="profile-form-card">
            <h3 className="profile-section-title">Edit Profile</h3>
            
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label className="profile-form-label">First Name</label>
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="profile-form-input"
                  />
                </div>
                <div className="profile-form-group">
                  <label className="profile-form-label">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="profile-form-input"
                  />
                </div>
              </div>

              <div className="profile-form-group">
                <label className="profile-form-label">Specialization</label>
                <input 
                  type="text" 
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="profile-form-input"
                />
              </div>

              <div className="profile-divider">
                <h4 className="profile-password-title">Change Password</h4>
                <div className="profile-password-space">
                  <div className="profile-form-group">
                    <label className="profile-form-label">New Password</label>
                    <input 
                      type="password" 
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current"
                      className="profile-form-input"
                    />
                  </div>
                  <div className="profile-form-group">
                    <label className="profile-form-label">Confirm New Password</label>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="profile-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="profile-button-group">
                <button type="submit" className="profile-save-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;