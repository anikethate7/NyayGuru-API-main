import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../styles/NotFound.css';

export const NotFound = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const navigate = useNavigate();
  
  // Feature cards configuration
  const featureCards = [
    { 
      id: "home", 
      title: "Go Home", 
      icon: "bi-house-fill",
      route: "/",
      description: "Return to the home page"
    },
    { 
      id: "chat", 
      title: "Chat Assistant", 
      icon: "bi-chat-dots-fill", 
      route: "/chat",
      description: "Ask questions about legal topics"
    },
    { 
      id: "dictionary", 
      title: "Legal Dictionary", 
      icon: "bi-book-fill", 
      route: "/dictionary",
      description: "Lookup legal terms and definitions"
    },
  ];
  
  const popularCategories = [
    { name: 'Criminal Law', path: '/chat?category=criminal' },
    { name: 'Property Law', path: '/chat?category=property' },
    { name: 'Family Law', path: '/chat?category=family' },
    { name: 'Cyber Law', path: '/chat?category=cyber' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Redirect to chat with search query
    if (searchQuery.trim()) {
      navigate(`/chat?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleFeatureSelect = (featureId) => {
    setSelectedFeature(featureId);
    // Find the selected feature and navigate after a brief delay
    const feature = featureCards.find(card => card.id === featureId);
    if (feature) {
      setTimeout(() => {
        navigate(feature.route);
      }, 300); // Short delay for transition effect
    }
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <div className="not-found-animation">
            {/* SVG animation of scales of justice or gavel */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="justice-scales">
              <g className="scale-animation">
                <path d="M60 20V100" stroke="#3B82F6" strokeWidth="3" />
                <path d="M30 40H90" stroke="#3B82F6" strokeWidth="3" />
                <circle cx="30" cy="50" r="15" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
                <circle cx="90" cy="50" r="15" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
                <rect x="50" y="100" width="20" height="10" fill="#3B82F6" />
              </g>
            </svg>
          </div>
          <h1>404</h1>
          <h2>Legal Page Not Found</h2>
          <p>The legal resource you're looking for doesn't exist or has been moved.</p>
          
          {!selectedFeature && (
            <>
              <form onSubmit={handleSearch} className="not-found-search">
                <input 
                  type="text" 
                  placeholder="Search legal topics..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="not-found-search-input"
                />
                <button type="submit" className="not-found-search-btn">
                  <i className="bi bi-search"></i>
                </button>
              </form>
              
              <div className="feature-navigation">
                {featureCards.map((card) => (
                  <div 
                    key={card.id} 
                    className="feature-nav-card" 
                    onClick={() => handleFeatureSelect(card.id)}
                  >
                    <i className={`bi ${card.icon}`}></i>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="popular-categories">
                <h3>Popular Legal Topics</h3>
                <div className="category-links">
                  {popularCategories.map((category, index) => (
                    <Link key={index} to={category.path} className="category-link">
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {selectedFeature && (
            <div className="selected-feature">
              <div className="loading-indicator">
                <i className="bi bi-arrow-clockwise"></i>
                <p>Accessing {featureCards.find(card => card.id === selectedFeature)?.title}...</p>
              </div>
            </div>
          )}
          
          {!selectedFeature && (
            <Link to="/" className="return-home-btn">
              <i className="bi bi-house-fill"></i> Return Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
