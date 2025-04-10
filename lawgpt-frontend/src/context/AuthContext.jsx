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
  const login = async (email, password, options = {}) => {
    setLoading(true);
    setError(null);

    // Create a timeout to prevent the loading state from getting stuck
    let loginTimeoutId = setTimeout(() => {
      console.error("AuthContext: Login timeout reached");
      setLoading(false);
      setError("Login request timed out. Please try again later.");
    }, 20000); // 20 seconds timeout as a last resort

    try {
      console.log("AuthContext: Attempting login for", email, "as", options.userType || "user");
      
      // Add user type to the login request
      const response = await api.login(email, password, options.userType);
      
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
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (err.response.status === 403) {
          errorMessage = "Access denied. Please check your user type.";
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
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
        // googleData is already the response object with token and user
        console.log("Using Google data for signup:", googleData);
        
        const token = googleData.token || googleData.access_token;
        const user = googleData.user;
        
        if (!token || !user) {
          console.error("Invalid Google login data:", googleData);
          throw new Error("Invalid response from Google login");
        }
        
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);
        return user;
      } else {
        // Normal signup flow
        const response = await api.register(userData);
        console.log("Signup successful:", response);
        
        if (!response.token || !response.user) {
          throw new Error("Invalid response from server. Registration failed.");
        }
        
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        setCurrentUser(response.user);
        return response.user;
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err.message || 
        (err.response?.data?.detail ? err.response.data.detail : "Signup failed. Please try again.");
      setError(errorMessage);
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
