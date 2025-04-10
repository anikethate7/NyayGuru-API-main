import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isDocumentPage = location.pathname === '/documents';
  const isDictionaryPage = location.pathname === '/dictionary';
  const isChatPage = location.pathname === '/chat' || location.pathname.startsWith('/category/');

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

  const scrollToSection = (sectionId) => {
    // If not on homepage, navigate to homepage first
    if (!isHomePage) {
      navigate('/', { state: { scrollTo: sectionId } });
      return;
    }
    
    // If already on homepage, scroll to the section
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check for scrollTo in location state when component mounts or updates
  useEffect(() => {
    if (isHomePage && location.state && location.state.scrollTo) {
      const sectionId = location.state.scrollTo;
      // Short delay to ensure the homepage has rendered
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        // Clear the state after scrolling
        navigate('/', { replace: true, state: {} });
      }, 100);
    }
  }, [isHomePage, location.state, navigate]);

  return (
    <nav className={`app-navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src="/images/logo.svg" alt="Lawzo Logo" className="logo" />
          <div className="brand-text">
            <p className="tagline">Your AI Legal Assistant</p>
          </div>
        </Link>
        
        <div className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
        </div>
        
        <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${isHomePage ? 'active' : ''}`}>
            Home
          </Link>
          
          <button 
            onClick={() => scrollToSection('services')}
            className={`nav-link ${isHomePage && location.hash === '#services' ? 'active' : ''}`}
          >
            Services
          </button>
          
          <button
            onClick={() => scrollToSection('category')}
            className={`nav-link ${isHomePage && location.hash === '#category' ? 'active' : ''}`}
          >
            Category
          </button>
          
          <button
            onClick={() => scrollToSection('why-us')}
            className={`nav-link ${isHomePage && location.hash === '#why-us' ? 'active' : ''}`}
          >
            Why Us
          </button>
          
          {currentUser && (
            <Link to="/profile" className={`nav-link profile-icon ${location.pathname === '/profile' ? 'active' : ''}`} aria-label="Profile">
              <i className="bi bi-person-circle"></i>
            </Link>
          )}
          
          <div className="nav-auth-section">
            {!currentUser && (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/signup" className="nav-link signup">
                  Sign Up
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