import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isDocumentPage = location.pathname === '/documents';
  const isDictionaryPage = location.pathname === '/dictionary';
  const isChatPage = location.pathname === '/chat' || location.pathname.startsWith('/category/');
  const isLawyerDashboard = location.pathname === '/lawyer-dashboard';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error('Failed to logout', e);
    }
  };

  // Check if we are on a page that should show only Home and Profile tabs
  const showLimitedTabs = isDocumentPage || isDictionaryPage || isChatPage;

  return (
    <nav className={`app-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <i className="bi bi-briefcase-fill"></i>
          <div>
            <h1>Nyay<span style={{ fontWeight: 400 }}>Guru</span></h1>
            <p className="tagline">Your AI Legal Assistant</p>
          </div>
        </Link>
        
        <div className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
        </div>
        
        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          {showLimitedTabs ? (
            <>
              <Link to="/" className={`nav-link ${isHomePage ? 'active' : ''}`}>
                <i className="bi bi-house"></i> Home
              </Link>
              
              {currentUser && (
                <>
                  <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                    <i className="bi bi-person"></i> Profile
                  </Link>
                  <Link to="/lawyer-dashboard" className={`nav-link ${isLawyerDashboard ? 'active' : ''}`}>
                    <i className="bi bi-briefcase"></i> Lawyer Dashboard
                  </Link>
                </>
              )}
            </>
          ) : (
            !isHomePage && (
              <>
                <Link to="/" className={`nav-link ${isHomePage ? 'active' : ''}`}>
                  <i className="bi bi-house"></i> Home
                </Link>
                
                <Link to="/chat" className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}>
                  <i className="bi bi-chat-dots"></i> Chat Assistant
                </Link>
                
                <Link to="/dictionary" className={`nav-link ${isDictionaryPage ? 'active' : ''}`}>
                  <i className="bi bi-book"></i> Legal Dictionary
                </Link>

                {currentUser && (
                  <Link to="/lawyer-dashboard" className={`nav-link ${isLawyerDashboard ? 'active' : ''}`}>
                    <i className="bi bi-briefcase"></i> Lawyer Dashboard
                  </Link>
                )}
              </>
            )
          )}
          
          <div className="nav-auth-section">
            {currentUser ? (
              <>
                {!showLimitedTabs && (
                  <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                    <i className="bi bi-person"></i> Profile
                  </Link>
                )}
                
                <button className="nav-link logout-btn" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i> Logout
                </button>
                <div className="user-profile">
                  <i className="bi bi-person-circle"></i>
                  <span className="username">{currentUser.username || currentUser.email}</span>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  <i className="bi bi-box-arrow-in-right"></i> Login
                </Link>
                <Link to="/signup" className="nav-link signup">
                  <i className="bi bi-person-plus"></i> Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 