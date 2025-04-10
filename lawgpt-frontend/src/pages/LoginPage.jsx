import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import axios from "axios";
import "../styles/Auth.css";
import api from "../services/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [serverStatus, setServerStatus] = useState({ status: "checking", message: "Checking server status..." });

  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Set page as loaded after a small delay for animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Check server status on component mount
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/auth/test", { timeout: 5000 });
        if (response.status === 200) {
          setServerStatus({ status: "online", message: "Server is online" });
        } else {
          setServerStatus({ status: "error", message: "Server is not responding correctly" });
        }
      } catch (error) {
        console.error("Server check failed:", error);
        setServerStatus({ 
          status: "offline", 
          message: "Cannot connect to the server. Please check if the backend service is running." 
        });
      }
    };
    
    checkServerStatus();
  }, []);

  // Get the redirect path from location state or default to homepage
  const redirectPath = location.state?.from?.pathname || "/";

  // Clear error when inputs change
  useEffect(() => {
    if (formTouched) {
      setError("");
    }
  }, [email, password, formTouched]);

  const handleInputChange = (e) => {
    setFormTouched(true);
    if (e.target.id === "email") {
      setEmail(e.target.value);
    } else if (e.target.id === "password") {
      setPassword(e.target.value);
    }
  };

  const validateForm = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }
    
    if (!password) {
      setError("Password is required");
      return false;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Add a timeout to prevent infinite loading
    const loginTimeout = setTimeout(() => {
      setIsSubmitting(false);
      setError("Login request timed out. Please try again.");
      
      // Add shake animation
      const formElement = document.querySelector('.auth-form-wrapper');
      if (formElement) {
        formElement.classList.add('shake');
        setTimeout(() => {
          formElement.classList.remove('shake');
        }, 500);
      }
    }, 15000); // 15 seconds timeout

    try {
      console.log("LoginPage: Attempting login");
      await login(email, password);
      console.log("LoginPage: Login successful, redirecting");
      clearTimeout(loginTimeout); // Clear timeout on success
      navigate(redirectPath, { replace: true });
    } catch (err) {
      clearTimeout(loginTimeout); // Clear timeout on error
      console.error("LoginPage: Login failed:", err);
      
      // Display a user-friendly error message
      setError(
        err.message || 
        err.response?.data?.detail || 
        "Failed to login. Please check your credentials."
      );
      
      // Add shake animation to the form
      const formElement = document.querySelector('.auth-form-wrapper');
      if (formElement) {
        formElement.classList.add('shake');
        setTimeout(() => {
          formElement.classList.remove('shake');
        }, 500);
      }
      
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsSubmitting(true);
    setError("");
    
    console.log("Google login credential received:", credentialResponse);
    
    try {
      // Send the Google token to our backend using API service
      console.log("Sending token to backend:", credentialResponse.credential);
      const response = await api.googleLogin(credentialResponse.credential);
      
      console.log("Response from backend:", response);
      
      // Update auth context with Google data
      await login(null, null, response);
      
      // Redirect
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error("Google login error details:", err);
      setError(
        err.message || 
        err.response?.data?.detail || 
        "Failed to login with Google. Please try again."
      );
      
      // Add shake animation to the form
      const formElement = document.querySelector('.auth-form-wrapper');
      if (formElement) {
        formElement.classList.add('shake');
        setTimeout(() => {
          formElement.classList.remove('shake');
        }, 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
  };

  // Server status indicator component
  const ServerStatusIndicator = () => {
    if (serverStatus.status === "checking") {
      return null; // Don't show while checking
    }
    
    if (serverStatus.status === "offline") {
      return (
        <div className="server-status error">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {serverStatus.message}
        </div>
      );
    }
    
    return null; // Don't show when online
  };

  return (
    <div className="auth-container">
      <div className="auth-decoration auth-decoration-1"></div>
      <div className="auth-decoration auth-decoration-2"></div>
      
      <div className={`auth-form-wrapper ${pageLoaded ? 'fade-in' : ''}`}>
        <div className="auth-header">
          <i className="bi bi-scale"></i>
          <h1>Lawzo</h1>
        </div>

        <h2>Login to Your Account</h2>
        
        <ServerStatusIndicator />

        {error && (
          <div className="auth-error">
            <i className="bi bi-exclamation-triangle"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              <i className="bi bi-envelope"></i> Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="bi bi-lock"></i> Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <><i className="bi bi-arrow-repeat spin"></i> Logging in...</>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i> Login
              </>
            )}
          </button>
          
          <div className="auth-divider">
            <span>or</span>
          </div>
          
          <div className="google-login-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="filled_blue"
              shape="pill"
              text="signin_with"
              size="large"
              width="100%"
            />
          </div>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
          <p>
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
