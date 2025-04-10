import React, { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiBriefcase, FiCheck, FiPhone } from 'react-icons/fi';
import { MdEmail } from 'react-icons/md';
import axios from 'axios';
import '../styles/LawyerListing.css';

const LawyerListing = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        console.log('Fetching lawyers from API...');
        
        // Use axios instead of fetch for better error handling
        const response = await axios.get('http://localhost:8000/api/users/lawyers');
        console.log('Lawyers data received:', response.data);
        
        // Transform the data to handle the user_metadata JSON field
        const lawyersData = response.data.map(lawyer => {
          // Parse user_metadata if it's a string
          const metadata = typeof lawyer.user_metadata === 'string' 
            ? JSON.parse(lawyer.user_metadata) 
            : lawyer.user_metadata || {};
            
          return {
            id: lawyer.id,
            full_name: lawyer.full_name,
            email: lawyer.email,
            username: lawyer.username,
            is_verified: metadata.is_verified || false,
            specialization: metadata.specialization || 'General Practice',
            location: metadata.office_address || 'N/A',
            experience: metadata.years_of_experience || 0,
            bar_council_id: metadata.bar_council_id || 'N/A',
            phone_number: metadata.phone_number || 'N/A',
            cases_handled: metadata.cases_handled || 0,
            success_rate: metadata.success_rate || '0%',
            rating: metadata.rating || 0,
            join_date: new Date(lawyer.created_at).toLocaleDateString()
          };
        });
        
        setLawyers(lawyersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching lawyers:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to fetch lawyers');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  const handleContactLawyer = (lawyer) => {
    console.log('Contacting lawyer:', lawyer.full_name);
    // In a real app, this would open a contact form or redirect to a messaging page
    alert(`Contact feature for ${lawyer.full_name} will be implemented soon.`);
  };

  if (loading) {
    return <div className="loading">Loading lawyers...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (lawyers.length === 0) {
    return <div className="no-lawyers">No lawyers found. Please check back later.</div>;
  }

  return (
    <div className="lawyer-listing">
      <h2 className="listing-title">Available Lawyers</h2>
      <div className="lawyer-grid">
        {lawyers.map((lawyer) => (
          <div key={lawyer.id} className="lawyer-card">
            <div className="lawyer-header">
              <div className="lawyer-avatar">
                {lawyer.full_name.charAt(0)}
              </div>
              <div className="lawyer-info">
                <h3 className="lawyer-name">{lawyer.full_name}</h3>
                <span className={`verification-badge ${lawyer.is_verified ? 'verified' : 'pending'}`}>
                  {lawyer.is_verified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
            <div className="lawyer-details">
              <div className="detail-item">
                <FiBriefcase className="detail-icon" />
                <span>{lawyer.specialization}</span>
              </div>
              <div className="detail-item">
                <FiMapPin className="detail-icon" />
                <span>{lawyer.location}</span>
              </div>
              <div className="detail-item">
                <span>Experience: {lawyer.experience} years</span>
              </div>
              <div className="detail-item">
                <FiPhone className="detail-icon" />
                <span>{lawyer.phone_number}</span>
              </div>
              <div className="detail-item">
                <MdEmail className="detail-icon" />
                <span>{lawyer.email}</span>
              </div>
            </div>
            <div className="lawyer-stats">
              <div className="stat-item">
                <span className="stat-value">{lawyer.cases_handled}</span>
                <span className="stat-label">Cases Handled</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{lawyer.success_rate}</span>
                <span className="stat-label">Success Rate</span>
              </div>
              {lawyer.rating > 0 && (
                <div className="stat-item">
                  <span className="stat-value">
                    <div className="star-rating-small">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star} 
                          className={`star ${star <= Math.round(lawyer.rating) ? 'filled' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </span>
                  <span className="stat-label">Rating</span>
                </div>
              )}
            </div>
            <div className="lawyer-meta">
              <span className="join-date">Member since: {lawyer.join_date}</span>
              <span className="lawyer-id">ID: {lawyer.bar_council_id}</span>
            </div>
            <button 
              className="contact-btn"
              onClick={() => handleContactLawyer(lawyer)}
            >
              Contact Lawyer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LawyerListing; 
