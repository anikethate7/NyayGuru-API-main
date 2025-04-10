import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "../styles/Auth.css";

const LawyerSignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    barCouncilId: "",
    specialization: "",
    yearsOfExperience: "",
    officeAddress: "",
    profilePicture: null,
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormTouched(true);
    const { name, value, files } = e.target;

    if (name === "profilePicture") {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    // Clear any previous errors
    setError("");

    // Check full name
    if (!formData.fullName.trim()) {
      setError("Full Name: This field is required and cannot be empty");
      return false;
    }

    // Check email
    if (!formData.email.trim()) {
      setError("Email: This field is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email: Please enter a valid email address");
      return false;
    }

    // Check password
    if (!formData.password) {
      setError("Password: This field is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password: Must be at least 8 characters long");
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError("Password: Must contain at least one uppercase letter, one lowercase letter, and one number");
      return false;
    }

    // Check confirm password
    if (formData.password !== formData.confirmPassword) {
      setError("Confirm Password: Passwords do not match. Please make sure both passwords are identical");
      return false;
    }

    // Check phone number
    if (!formData.phoneNumber.trim()) {
      setError("Phone Number: This field is required");
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      setError("Phone Number: Please enter a valid 10-digit phone number");
      return false;
    }

    // Check bar council ID
    if (!formData.barCouncilId.trim()) {
      setError("Bar Council ID: This field is required");
      return false;
    }

    // Check specialization
    if (!formData.specialization) {
      setError("Specialization: Please select your area of specialization");
      return false;
    }

    // Check years of experience
    if (!formData.yearsOfExperience) {
      setError("Years of Experience: This field is required");
      return false;
    }
    if (isNaN(formData.yearsOfExperience) || formData.yearsOfExperience < 0) {
      setError("Years of Experience: Must be a positive number");
      return false;
    }

    // Check office address
    if (!formData.officeAddress.trim()) {
      setError("Office Address: This field is required");
      return false;
    }
    if (formData.officeAddress.trim().length < 10) {
      setError("Office Address: Please provide a complete address (minimum 10 characters)");
      return false;
    }

    // If all validations pass
    return true;
  };

  const handleSubmit = async (e) => {
    try {
      console.log("Form submission started");
      e.preventDefault();
      console.log("handleSubmit called");
      console.log("Form data:", formData);

      if (!validateForm()) {
        console.log("Form validation failed");
        return;
      }

      setIsSubmitting(true);
      setError("");

      // Create a JSON object with the required fields
      const userData = {
        username: formData.email.split('@')[0], // Generate username from email
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        // Additional fields for lawyer profile
        phone_number: formData.phoneNumber,
        bar_council_id: formData.barCouncilId,
        specialization: formData.specialization,
        years_of_experience: formData.yearsOfExperience,
        office_address: formData.officeAddress,
        user_type: "lawyer"
      };

      // Log the data being sent
      console.log("Data being sent:", userData);

      console.log("Sending request to server...");
      const response = await axios.post(
        "http://localhost:8000/api/auth/register",
        userData,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
      console.log("Server response:", response);

      // Check if registration was successful
      if (response.status === 200 || response.status === 201) {
        console.log("Registration successful, redirecting to login...");
        setError("Registration successful! Please login to continue.");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Signup error:", err);
      if (err.response?.status === 422) {
        // Handle validation errors
        const validationErrors = err.response.data.detail;
        console.log("Validation errors:", validationErrors);
        
        if (Array.isArray(validationErrors)) {
          // If it's an array of errors, format them nicely
          const formattedErrors = validationErrors.map(err => {
            const field = err.loc[1] || 'Field'; // Get the field name from the error location
            return `${field}: ${err.msg}`;
          }).join('\n');
          setError(formattedErrors);
        } else if (typeof validationErrors === 'string') {
          // If it's a string, use it directly
          setError(validationErrors);
        } else if (validationErrors && typeof validationErrors === 'object') {
          // If it's an object, format the errors
          const formattedErrors = Object.entries(validationErrors)
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
          setError(formattedErrors);
        } else {
          setError("Validation failed. Please check your input.");
        }
      } else if (err.response?.status === 409) {
        // Handle conflict (e.g., email already exists)
        setError("Email: This email is already registered. Please login or use a different email.");
      } else if (!err.response) {
        // Network error
        setError("Cannot connect to server. Please check your internet connection.");
      } else {
        // Other errors
        setError(
          err.response?.data?.detail || 
          err.message || 
          "Failed to sign up. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormSubmit = (e) => {
    console.log("Form onSubmit triggered");
    handleSubmit(e).catch(err => {
      console.error("Unhandled error in form submission:", err);
      setError("An unexpected error occurred. Please try again.");
    });
  };

  return (
    <div className="auth-page">
      <div className={`auth-form-wrapper ${formTouched ? "touched" : ""}`}>
        <h2>Lawyer Sign Up</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={onFormSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="barCouncilId">
              Bar Council ID / License Number
            </label>
            <input
              type="text"
              id="barCouncilId"
              name="barCouncilId"
              value={formData.barCouncilId}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialization">
              Practice Area / Specialization
            </label>
            <select
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Specialization</option>
              <option value="Criminal">Criminal Law</option>
              <option value="Civil">Civil Law</option>
              <option value="Corporate">Corporate Law</option>
              <option value="Family">Family Law</option>
              <option value="Property">Property Law</option>
              <option value="Intellectual">Intellectual Property</option>
              <option value="Tax">Tax Law</option>
              <option value="Constitutional">Constitutional Law</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="yearsOfExperience">Years of Experience</label>
            <input
              type="number"
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="officeAddress">Office Address</label>
            <textarea
              id="officeAddress"
              name="officeAddress"
              value={formData.officeAddress}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profilePicture">Profile Picture (Optional)</label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept="image/*"
              onChange={handleInputChange}
            />
          </div>

          <button 
            type="submit" 
            className="auth-button" 
            disabled={isSubmitting}
            onClick={() => console.log("Button clicked")}
          >
            {isSubmitting ? "Signing Up..." : "Sign Up"}
          </button>
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

export default LawyerSignupPage;
