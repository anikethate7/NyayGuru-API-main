import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import axios from "axios";
import "../styles/Auth.css";
import api from "../services/api";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  // Set page as loaded after a small delay for animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Clear error when inputs change
  useEffect(() => {
    if (formTouched) {
      setError("");
    }
  }, [formData, formTouched]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormTouched(true);
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      setError("All fields are required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    // Password strength validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError("Password must include uppercase, lowercase, and numbers");
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

    try {
      const userData = {
        username: `${formData.firstName.toLowerCase()}${formData.lastName.toLowerCase()}`,
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
      };

      await signup(userData);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsSubmitting(true);
    setError("");
    
    try {
      // Send the Google token to our backend using API service
      const response = await api.googleLogin(credentialResponse.credential);
      
      // Update auth context with Google data
      await signup(null, response);
      
      // Redirect
      navigate("/");
    } catch (err) {
      console.error("Google signup error:", err);
      setError(
        err.message || 
        err.response?.data?.detail || 
        "Failed to signup with Google. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google signup failed. Please try again.");
  };

  return (
    <div className="auth-container">
      <div className="auth-decoration auth-decoration-1"></div>
      <div className="auth-decoration auth-decoration-2"></div>
      
      <div className={`auth-form-wrapper ${pageLoaded ? 'fade-in' : ''}`}>
        <div className="auth-header">
          <i className="bi bi-scale"></i>
          <h1>NyayGuru</h1>
        </div>

        <h2>Create Your Account</h2>

        {error && (
          <div className="auth-error">
            <i className="bi bi-exclamation-triangle"></i> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">
                <i className="bi bi-person"></i> First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First Name"
                disabled={isSubmitting}
                autoComplete="given-name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                <i className="bi bi-person"></i> Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                disabled={isSubmitting}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <i className="bi bi-envelope"></i> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
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
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password (min. 8 characters)"
              disabled={isSubmitting}
              autoComplete="new-password"
              required
              minLength="8"
            />
            <small className="password-hints">
              <i className="bi bi-info-circle"></i> Must contain at least 8 characters with uppercase, lowercase and numbers
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <i className="bi bi-lock-fill"></i> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? (
              <><i className="bi bi-arrow-repeat spin"></i> Creating Account...</>
            ) : (
              <><i className="bi bi-person-plus"></i> Create Account</>
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
              text="signup_with"
              size="large"
              width="100%"
            />
          </div>
        </form>

        <div className="auth-links">
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
