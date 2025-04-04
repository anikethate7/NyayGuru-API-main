import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      if (token) {
        try {
          // Validate token with backend
          const userData = await api.validateToken();
          
          // Ensure we got valid user data back
          if (userData && userData.username) {
            console.log("Token validation successful:", userData);
            setCurrentUser(userData);
          } else {
            console.error("Auth validation returned invalid user data");
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Auth validation error:", err);
          // Don't try to validate again if token is invalid
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          setCurrentUser(null);
        }
      } else {
        // Make sure we explicitly set loading to false when no token exists
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Auth check error:", err);
      // Ensure we clean up auth data on any error
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check authentication on initial load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for localStorage changes to keep auth state in sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' || e.key === 'user') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login function
  const login = async (email, password, googleData = null) => {
    setLoading(true);
    setError(null);

    // Create a timeout to prevent the loading state from getting stuck
    let loginTimeoutId = setTimeout(() => {
      console.error("AuthContext: Login timeout reached");
      setLoading(false);
      setError("Login request timed out. Please try again later.");
    }, 20000); // 20 seconds timeout as a last resort

    try {
      let response;
      
      // If we have googleData, use that instead of email/password
      if (googleData) {
        console.log("AuthContext: Using Google login data");
        response = googleData;
      } else {
        console.log("AuthContext: Attempting login for", email);
        response = await api.login(email, password);
      }
      
      // Clear the timeout when we get a response
      clearTimeout(loginTimeoutId);
      
      // Store token and user data in localStorage
      localStorage.setItem("authToken", response.token || response.access_token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      // Update state with user data
      setCurrentUser(response.user);
      console.log("AuthContext: Login successful");
      return response.user;
    } catch (err) {
      // Clear the timeout when we get an error
      clearTimeout(loginTimeoutId);
      
      console.error("AuthContext: Login error:", err);
      
      // Set a user-friendly error message
      const errorMessage = err.message || 
        (err.response?.data?.detail ? err.response.data.detail : "Login failed. Please try again.");
      
      setError(errorMessage);
      
      // Ensure we don't have any lingering auth data on error
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (userData, googleData = null) => {
    setLoading(true);
    setError(null);

    try {
      if (googleData) {
        // If we have googleData, use that directly
        const { user, access_token } = googleData.data;
        localStorage.setItem("authToken", access_token);
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);
        return user;
      } else {
        // Normal signup flow
        const { user, token } = await api.register(userData);
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);
        return user;
      }
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setCurrentUser(null);
    }
  };

  // Update user profile function
  const updateUserProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await api.updateUserProfile(profileData);
      
      // Update the stored user data
      if (updatedUser) {
        // Get the current stored user data
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        
        // Update with the new data, preserving any fields not included in the update
        const mergedUser = { ...storedUser, ...updatedUser };
        
        // Save to localStorage
        localStorage.setItem("user", JSON.stringify(mergedUser));
        
        // Update state
        setCurrentUser(mergedUser);
      }
      
      return updatedUser;
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    signup,
    logout,
    updateUserProfile,
    checkAuthStatus,
    setCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
