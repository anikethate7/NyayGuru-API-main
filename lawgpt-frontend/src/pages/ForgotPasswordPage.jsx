import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await api.resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err.message || "Failed to process your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <i className="bi bi-scale"></i>
          <h1>LawGPT</h1>
        </div>

        <h2>Reset Your Password</h2>

        {error && <div className="auth-error">{error}</div>}

        {success ? (
          <div className="auth-success">
            <i className="bi bi-check-circle"></i>
            <p>
              If an account exists with the email {email}, you will receive
              password reset instructions.
            </p>
            <Link to="/login" className="auth-button">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <i className="bi bi-arrow-repeat spin"></i>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

        <div className="auth-links">
          <p>
            <Link to="/login">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
