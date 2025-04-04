import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsAuthenticated(true);
      try {
        const userData = JSON.parse(user);
        setUsername(userData.username || userData.email);
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <i className="bi bi-briefcase-fill"></i>
          <div>
            <h1>NyayGuru</h1>
            <p className="tagline">Your AI Legal Assistant</p>
          </div>
        </div>

        <div className="mobile-menu-toggle" onClick={toggleMenu}>
          <i className={`bi ${isMenuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
        </div>

        <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li className="user-info">
                  <span>
                    <i className="bi bi-person-circle"></i> {username}
                  </span>
                </li>
                <li>
                  <button className="logout-btn" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="login-btn">
                    <i className="bi bi-box-arrow-in-right"></i> Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="signup-btn">
                    <i className="bi bi-person-plus"></i> Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
