import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { currentUser, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    profession: currentUser?.profession || "",
  });

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser?.firstName || "",
        lastName: currentUser?.lastName || "",
        email: currentUser?.email || "",
        phone: currentUser?.phone || "",
        profession: currentUser?.profession || "",
      });
    }
  }, [currentUser]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ type: "", message: "" });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert form data to backend expected format
      const profileUpdateData = {
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        // Add additional fields as custom properties
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        profession: formData.profession,
      };
      
      await updateUserProfile(profileUpdateData);
      
      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      });
      
      setEditMode(false);
    } catch (error) {
      console.error("Profile update failed:", error);
      setNotification({
        type: "error",
        message: error.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.type === "success" ? (
            <i className="bi bi-check-circle"></i>
          ) : (
            <i className="bi bi-exclamation-circle"></i>
          )}
          <span>{notification.message}</span>
          <button
            className="close-notification"
            onClick={() => setNotification({ type: "", message: "" })}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>
      )}
    
      <div className="profile-sidebar">
        <div className="profile-avatar-container">
          <div className="profile-avatar-large">
            {currentUser.profileImage ? (
              <img src={currentUser.profileImage} alt={`${currentUser.firstName}'s avatar`} />
            ) : (
              <div className="avatar-placeholder">
                {currentUser.firstName ? currentUser.firstName.charAt(0).toUpperCase() : "U"}
                {currentUser.lastName ? currentUser.lastName.charAt(0).toUpperCase() : ""}
              </div>
            )}
          </div>
          <h3 className="profile-name-sidebar">
            {currentUser.firstName} {currentUser.lastName}
          </h3>
          <span className="profile-member-since">Member since {new Date(currentUser.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>

        <nav className="profile-navigation">
          <button 
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`} 
            onClick={() => setActiveTab("profile")}
          >
            <i className="bi bi-person"></i> Your Profile
          </button>
          <button 
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`} 
            onClick={() => setActiveTab("settings")}
          >
            <i className="bi bi-gear"></i> Account Settings
          </button>
          <button 
            className={`nav-item ${activeTab === "security" ? "active" : ""}`} 
            onClick={() => setActiveTab("security")}
          >
            <i className="bi bi-shield-lock"></i> Security
          </button>
          <button 
            className={`nav-item ${activeTab === "activity" ? "active" : ""}`} 
            onClick={() => setActiveTab("activity")}
          >
            <i className="bi bi-clock-history"></i> Activity
          </button>
          <button 
            className={`nav-item ${activeTab === "preferences" ? "active" : ""}`} 
            onClick={() => setActiveTab("preferences")}
          >
            <i className="bi bi-sliders"></i> Preferences
          </button>
        </nav>

        <div className="profile-sidebar-footer">
          <button
            className="logout-button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <><i className="bi bi-arrow-repeat spin"></i> Logging out...</>
            ) : (
              <><i className="bi bi-box-arrow-right"></i> Logout</>
            )}
          </button>
        </div>
      </div>

      <div className="profile-content-container">
        {activeTab === "profile" && (
          <div className="profile-section">
            <div className="section-header">
              <h2><i className="bi bi-person-badge"></i> Your Profile</h2>
              <button 
                className="edit-button"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <><i className="bi bi-x-lg"></i> Cancel</>
                ) : (
                  <><i className="bi bi-pencil"></i> Edit Profile</>
                )}
              </button>
            </div>
            
            {editMode ? (
              <form onSubmit={handleSaveProfile} className="profile-edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="profession">Profession</label>
                  <input
                    type="text"
                    id="profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
                
                <div className="form-buttons">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><i className="bi bi-arrow-repeat spin"></i> Saving...</>
                    ) : (
                      <><i className="bi bi-check-lg"></i> Save Changes</>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setEditMode(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info">
                <div className="info-card">
                  <div className="info-header">
                    <i className="bi bi-person-vcard"></i>
                    <h3>Personal Information</h3>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{currentUser.firstName} {currentUser.lastName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{currentUser.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone</span>
                    <span className="info-value">{currentUser.phone || "Not provided"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Profession</span>
                    <span className="info-value">{currentUser.profession || "Not specified"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="profile-section">
            <div className="section-header">
              <h2><i className="bi bi-gear"></i> Account Settings</h2>
            </div>
            <div className="settings-content">
              <div className="settings-card">
                <h3><i className="bi bi-envelope"></i> Email Notifications</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Lawyer Updates</span>
                    <span className="setting-description">Receive notifications about lawyer appointments and consultations</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Newsletter</span>
                    <span className="setting-description">Receive our monthly legal newsletter</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-card">
                <h3><i className="bi bi-globe"></i> Language & Region</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Language</span>
                    <span className="setting-description">Set your preferred language</span>
                  </div>
                  <select className="select-control">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="profile-section">
            <div className="section-header">
              <h2><i className="bi bi-shield-lock"></i> Security</h2>
            </div>
            <div className="security-content">
              <div className="settings-card">
                <h3><i className="bi bi-key"></i> Password</h3>
                <p>Last changed: 30 days ago</p>
                <button className="action-button">
                  <i className="bi bi-pencil"></i> Change Password
                </button>
              </div>
              
              <div className="settings-card">
                <h3><i className="bi bi-shield-check"></i> Two-Factor Authentication</h3>
                <p>Enhance your account security with 2FA</p>
                <button className="action-button">
                  <i className="bi bi-shield-plus"></i> Enable 2FA
                </button>
              </div>
              
              <div className="settings-card">
                <h3><i className="bi bi-devices"></i> Active Sessions</h3>
                <div className="session-item">
                  <div className="session-info">
                    <i className="bi bi-laptop"></i>
                    <div className="session-details">
                      <span className="device-name">Windows PC - Chrome</span>
                      <span className="device-location">Mumbai, India</span>
                    </div>
                  </div>
                  <span className="session-status current">Current</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="profile-section">
            <div className="section-header">
              <h2><i className="bi bi-clock-history"></i> Recent Activity</h2>
            </div>
            <div className="activity-timeline">
              <div className="timeline-item">
                <div className="timeline-icon">
                  <i className="bi bi-chat-left-text"></i>
                </div>
                <div className="timeline-content">
                  <h4>Lawyer Consultation</h4>
                  <p>You scheduled a consultation with Adv. Sharma</p>
                  <span className="timeline-date">Today, 2:30 PM</span>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-icon">
                  <i className="bi bi-file-text"></i>
                </div>
                <div className="timeline-content">
                  <h4>Document Generated</h4>
                  <p>Generated a draft for rental agreement</p>
                  <span className="timeline-date">Yesterday, 4:15 PM</span>
                </div>
              </div>
              
              <div className="timeline-item">
                <div className="timeline-icon">
                  <i className="bi bi-person"></i>
                </div>
                <div className="timeline-content">
                  <h4>Account Updated</h4>
                  <p>You updated your profile information</p>
                  <span className="timeline-date">3 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="profile-section">
            <div className="section-header">
              <h2><i className="bi bi-sliders"></i> Preferences</h2>
            </div>
            <div className="settings-content">
              <div className="settings-card">
                <h3><i className="bi bi-moon-stars"></i> Appearance</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Dark Mode</span>
                    <span className="setting-description">Switch between light and dark theme</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="settings-card">
                <h3><i className="bi bi-chat-left-dots"></i> Chat Preferences</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Show Timestamps</span>
                    <span className="setting-description">Display message timestamps in chat</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-label">Sound Notifications</span>
                    <span className="setting-description">Play sound when receiving messages</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
