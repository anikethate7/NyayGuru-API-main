import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiUsers, FiSettings, FiLogOut, FiCheck, FiX } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import '../styles/LawyerDashboard.css';

const LawyerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  
  // Simulated data - replace with actual API calls
  const [lawyer, setLawyer] = useState({
    name: currentUser?.full_name || 'John Doe',
    email: currentUser?.email || 'john.doe@example.com',
    specialization: currentUser?.user_metadata?.specialization || 'Criminal Law',
    experience: currentUser?.user_metadata?.years_of_experience || 10,
    location: currentUser?.user_metadata?.office_address || 'Mumbai, India',
    verificationStatus: 'Verified',
    barCouncilId: currentUser?.user_metadata?.bar_council_id || 'MH123456',
    phone: currentUser?.user_metadata?.phone_number || '+91 98765 43210',
    education: 'LLB, National Law University Delhi',
    languages: ['English', 'Hindi', 'Marathi'],
    rating: 4.8,
    ratingCount: 24,
    about: 'Experienced lawyer with a focus on Criminal Law. Providing legal services for over 10 years with expertise in criminal defense, bail applications, and trial representation.'
  });

  const [clientRequests, setClientRequests] = useState([
    {
      id: 1,
      clientName: 'Alice Smith',
      query: 'Need legal consultation regarding property dispute',
      requestDate: '2024-04-08',
      contact: '+91 98765 43210',
      status: 'pending'
    },
    {
      id: 2,
      clientName: 'Robert Johnson',
      query: 'Seeking advice on divorce proceedings',
      requestDate: '2024-04-10',
      contact: '+91 98123 45678',
      status: 'pending'
    },
    {
      id: 3,
      clientName: 'Priya Patel',
      query: 'Need help with contract review for business partnership',
      requestDate: '2024-04-11',
      contact: '+91 87654 32109',
      status: 'pending'
    }
  ]);

  // Fetch lawyer data and client requests on component mount
  useEffect(() => {
    // In a real app, you would fetch data from your API here
    console.log('LawyerDashboard mounted, fetching data...');
    console.log('Current user:', currentUser);
    
    // Initialize lawyer data from currentUser if available
    if (currentUser) {
      setLawyer(prev => ({
        ...prev,
        name: currentUser.full_name || prev.name,
        email: currentUser.email || prev.email,
        specialization: currentUser.user_metadata?.specialization || prev.specialization,
        experience: currentUser.user_metadata?.years_of_experience || prev.experience,
        location: currentUser.user_metadata?.office_address || prev.location
      }));
    }
    
    // You would also fetch client requests here
  }, [currentUser]);

  const handleRequestAction = (requestId, action) => {
    // In a real app, you would call your API here
    console.log(`Action ${action} performed on request ${requestId}`);
    
    setClientRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === requestId
          ? { ...request, status: action }
          : request
      )
    );
  };

  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTabChange = (tab) => {
    console.log('Changing tab to:', tab);
    setActiveTab(tab);
  };

  // Render different content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-grid">
            {/* Profile Section */}
            <div className="dashboard-card">
              <h2 className="card-title">Lawyer Profile</h2>
              <div className="profile-info">
                <div className="profile-item">
                  <FiUser />
                  <div className="profile-item-content">
                    <p className="profile-label">Name</p>
                    <p className="profile-value">{lawyer.name}</p>
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-item-content">
                    <p className="profile-label">Email</p>
                    <p className="profile-value">{lawyer.email}</p>
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-item-content">
                    <p className="profile-label">Specialization</p>
                    <p className="profile-value">{lawyer.specialization}</p>
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-item-content">
                    <p className="profile-label">Experience</p>
                    <p className="profile-value">{lawyer.experience} years</p>
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-item-content">
                    <p className="profile-label">Location</p>
                    <p className="profile-value">{lawyer.location}</p>
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-item-content">
                    <p className="profile-label">Verification Status</p>
                    <span className={`verification-badge ${
                      lawyer.verificationStatus === 'Verified'
                        ? 'badge-verified'
                        : 'badge-pending'
                    }`}>
                      {lawyer.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Requests Section */}
            <div className="dashboard-card">
              <h2 className="card-title">Client Requests</h2>
              {clientRequests.length === 0 ? (
                <p className="no-requests">No client requests yet</p>
              ) : (
                <div className="client-requests">
                  {clientRequests.map((request) => (
                    <div key={request.id} className="request-card">
                      <div className="request-header">
                        <h3 className="client-name">{request.clientName}</h3>
                        <span className="request-date">{request.requestDate}</span>
                      </div>
                      <p className="request-query">{request.query}</p>
                      <p className="client-contact">{request.contact}</p>
                      {request.status === 'pending' && (
                        <div className="request-actions">
                          <button
                            onClick={() => handleRequestAction(request.id, 'accepted')}
                            className="btn-accept"
                          >
                            <FiCheck />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, 'ignored')}
                            className="btn-ignore"
                          >
                            <FiX />
                            <span>Ignore</span>
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className={`status-badge ${
                          request.status === 'accepted'
                            ? 'badge-accepted'
                            : 'badge-ignored'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="dashboard-card full-width">
            <h2 className="card-title">My Profile</h2>
            
            <div className="detailed-profile">
              <div className="profile-header">
                <div className="profile-avatar">
                  {lawyer.name.charAt(0)}
                </div>
                <div className="profile-header-info">
                  <h3 className="profile-name">{lawyer.name}</h3>
                  <div className="profile-rating">
                    <span className="star-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          className={`star ${star <= Math.round(lawyer.rating) ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </span>
                    <span className="rating-text">{lawyer.rating} out of 5 ({lawyer.ratingCount} reviews)</span>
                  </div>
                  <div className="verification-status">
                    <span className={`verification-badge ${
                      lawyer.verificationStatus === 'Verified'
                        ? 'badge-verified'
                        : 'badge-pending'
                    }`}>
                      {lawyer.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="profile-about">
                <h4 className="section-title">About</h4>
                <p>{lawyer.about}</p>
              </div>
              
              <div className="profile-details">
                <div className="details-column">
                  <div className="detail-item">
                    <h4 className="detail-label">Email</h4>
                    <p className="detail-value">{lawyer.email}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h4 className="detail-label">Phone</h4>
                    <p className="detail-value">{lawyer.phone}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h4 className="detail-label">Bar Council ID</h4>
                    <p className="detail-value">{lawyer.barCouncilId}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h4 className="detail-label">Experience</h4>
                    <p className="detail-value">{lawyer.experience} years</p>
                  </div>
                </div>
                
                <div className="details-column">
                  <div className="detail-item">
                    <h4 className="detail-label">Specialization</h4>
                    <p className="detail-value">{lawyer.specialization}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h4 className="detail-label">Location</h4>
                    <p className="detail-value">{lawyer.location}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h4 className="detail-label">Education</h4>
                    <p className="detail-value">{lawyer.education}</p>
                  </div>
                  
                  <div className="detail-item">
                    <h4 className="detail-label">Languages</h4>
                    <p className="detail-value">{lawyer.languages.join(', ')}</p>
                  </div>
                </div>
              </div>
              
              <div className="profile-actions">
                <button className="btn-primary" onClick={() => alert('Profile edit functionality will be implemented soon')}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'clients':
        return (
          <div className="dashboard-card full-width">
            <h2 className="card-title">All Client Requests</h2>
            {clientRequests.length === 0 ? (
              <p className="no-requests">No client requests yet</p>
            ) : (
              <div className="client-requests">
                {clientRequests.map((request) => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <h3 className="client-name">{request.clientName}</h3>
                      <span className="request-date">{request.requestDate}</span>
                    </div>
                    <p className="request-query">{request.query}</p>
                    <p className="client-contact">{request.contact}</p>
                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button
                          onClick={() => handleRequestAction(request.id, 'accepted')}
                          className="btn-accept"
                        >
                          <FiCheck />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleRequestAction(request.id, 'ignored')}
                          className="btn-ignore"
                        >
                          <FiX />
                          <span>Ignore</span>
                        </button>
                      </div>
                    )}
                    {request.status !== 'pending' && (
                      <span className={`status-badge ${
                        request.status === 'accepted'
                          ? 'badge-accepted'
                          : 'badge-ignored'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'settings':
        return (
          <div className="dashboard-card full-width">
            <h2 className="card-title">Settings</h2>
            <div className="settings-options">
              <p>Here you can manage your account settings, notifications, and privacy options.</p>
              <button className="btn-primary" onClick={() => alert('Settings functionality will be implemented soon')}>
                Save Changes
              </button>
            </div>
          </div>
        );
      
      default:
        return <div>Select a tab from the sidebar</div>;
    }
  };

  return (
    <div className="lawyer-dashboard">
      {/* Top Navigation */}
      <nav className="lawyer-nav">
        <div className="lawyer-nav-left">
          <h1>Lawyer Dashboard</h1>
        </div>
        <div className="lawyer-nav-right">
          <span className="lawyer-name">{lawyer.name}</span>
          <button onClick={handleSignOut} className="signout-btn">
            <FiLogOut />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <ul>
              <li>
                <a 
                  href="#dashboard" 
                  className={activeTab === 'dashboard' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('dashboard');
                  }}
                >
                  <MdDashboard />
                  <span>Dashboard</span>
                </a>
              </li>
              <li>
                <a 
                  href="#profile" 
                  className={activeTab === 'profile' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('profile');
                  }}
                >
                  <FiUser />
                  <span>My Profile</span>
                </a>
              </li>
              <li>
                <a 
                  href="#clients" 
                  className={activeTab === 'clients' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('clients');
                  }}
                >
                  <FiUsers />
                  <span>Client Requests</span>
                </a>
              </li>
              <li>
                <a 
                  href="#settings" 
                  className={activeTab === 'settings' ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTabChange('settings');
                  }}
                >
                  <FiSettings />
                  <span>Settings</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default LawyerDashboard; 