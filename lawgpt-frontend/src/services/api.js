import axios from "axios";

// Update API URL to use relative path or environment variable if available
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add a 10 second timeout for all requests
});

// Add a request interceptor to add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    
    // Only clear token for specific 401 errors from authentication endpoints
    if (error.response && error.response.status === 401 && 
        (error.config.url.includes('/auth/token') || 
         error.config.url.includes('/auth/me') || 
         error.config.url.includes('/auth/refresh'))) {
      console.log("Authentication failed, clearing tokens");
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // The redirect will be handled by React Router in the AuthContext
    }
    return Promise.reject(error);
  }
);

const api = {
  // Auth endpoints
  register: async (userData) => {
    try {
      console.log("Registering new user:", userData.username);
      
      const response = await axiosInstance.post('/auth/register', userData);
      console.log("Registration API response:", response.data);
      
      // The backend now returns both token and user data directly
      if (!response.data || !response.data.access_token) {
        throw new Error("Invalid response from server. Missing access token.");
      }
      
      return {
        token: response.data.access_token,
        user: response.data.user || userData // Fallback to input userData if no user in response
      };
    } catch (error) {
      console.error("Registration error:", error);
      
      // Provide more descriptive error messages
      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data.detail?.includes('Email already registered')) {
            throw new Error("This email is already registered. Please use a different email or try logging in.");
          } else if (error.response.data.detail?.includes('Username already taken')) {
            throw new Error("This username is already taken. Please choose a different username.");
          } else if (error.response.data.detail) {
            throw new Error(error.response.data.detail);
          }
        }
      }
      
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      console.log("Attempting login with:", { email });
      
      const response = await axiosInstance.post('/auth/token', new URLSearchParams({
        username: email,
        password: password
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000 // Longer timeout specifically for login
      });
      
      console.log("Login API response:", response.data);
      
      if (!response.data || !response.data.access_token) {
        throw new Error("Invalid response from server. Missing access token.");
      }
      
      // Use the user data from the response if available, or create a basic user object
      const userData = response.data.user || { 
        username: email.split('@')[0], 
        email: email 
      };
      
      return {
        token: response.data.access_token,
        user: userData
      };
    } catch (error) {
      console.error("Login error:", error);
      
      // Check for timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error("Login request timed out. The server might be overloaded or unavailable.");
      }
      
      // Provide more specific error messages based on the error
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error("Invalid username or password. Please try again.");
        } else if (error.response.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else if (error.response.data && error.response.data.detail) {
          throw new Error(error.response.data.detail);
        } else if (error.response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
      }
      
      // Network error
      if (error.message === 'Network Error') {
        throw new Error("Cannot connect to server. Please check your internet connection.");
      }
      
      // Generic error message as fallback
      throw new Error("Login failed. Please check your connection and try again.");
    }
  },

  logout: async () => {
    // Since there might not be a server-side logout endpoint,
    // we can implement a client-side logout
    // This function is intentionally left as a stub to allow for future server-side logout
    // The actual token removal happens in the AuthContext
    return true;
  },

  validateToken: async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error("Token validation error:", error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await axiosInstance.post('/auth/refresh');
      return response.data;
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  },

  getUserProfile: async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error("Profile fetch error:", error);
      throw error;
    }
  },

  updateUserProfile: async (userData) => {
    try {
      const response = await axiosInstance.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  },

  googleLogin: async (token) => {
    try {
      console.log("Attempting Google login with token");
      
      const response = await axiosInstance.post('/auth/google-login', {
        token: token
      }, {
        timeout: 15000 // Longer timeout specifically for Google login
      });
      
      console.log("Google login API response:", response.data);
      
      // Make sure we have the necessary data
      if (!response.data || !response.data.access_token) {
        throw new Error("Invalid response from server. Missing access token.");
      }
      
      // In case the backend doesn't return a user object, create a basic one
      let userData = response.data.user;
      if (!userData && response.data.email) {
        userData = {
          email: response.data.email,
          username: response.data.email.split('@')[0],
          full_name: response.data.name || ''
        };
      }
      
      console.log("Google login successful, returning data");
      
      return {
        token: response.data.access_token,
        user: userData || { username: 'user' + Date.now() }
      };
    } catch (error) {
      console.error("Google login error:", error);
      
      // Check for timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error("Google login request timed out. The server might be overloaded or unavailable.");
      }
      
      // Provide more specific error messages based on the error
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error("Google authentication failed. Please try again.");
        } else if (error.response.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else if (error.response.data && error.response.data.detail) {
          throw new Error(error.response.data.detail);
        } else if (error.response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        }
      }
      
      // Network error
      if (error.message === 'Network Error') {
        throw new Error("Cannot connect to server. Please check your internet connection.");
      }
      
      // Generic error message as fallback
      throw new Error("Google login failed. Please check your connection and try again.");
    }
  },

  // Chat endpoints
  createSession: async () => {
    try {
      const response = await axiosInstance.post(`/chat/session`);
      return response.data;
    } catch (error) {
      console.error("Create session error:", error);
      throw error;
    }
  },

  // Fetch all available legal categories
  fetchCategories: async () => {
    try {
      const response = await axiosInstance.get(`/categories/`);
      return response.data;
    } catch (error) {
      console.error("Fetch categories error:", error);
      throw error;
    }
  },

  // Fetch all supported languages
  fetchLanguages: async () => {
    try {
      const response = await axiosInstance.get(`/categories/languages`);
      return response.data;
    } catch (error) {
      console.error("Fetch languages error:", error);
      throw error;
    }
  },

  // Document Analysis endpoints
  uploadDocument: async (formData) => {
    try {
      const response = await axiosInstance.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
          // The Authorization header will be added by the interceptor
        },
        timeout: 30000 // Longer timeout for document upload and analysis
      });
      return response.data;
    } catch (error) {
      console.error("Document upload error:", error);
      throw error;
    }
  },

  // Send a chat message
  sendMessage: async (query, category, language, sessionId, messageHistory = []) => {
    try {
      console.log("Sending message:", {query, category, language, sessionId});
      
      if (!query || !category || !sessionId) {
        throw new Error("Missing required parameters: query, category, and sessionId are required");
      }
      
      // Convert category to kebab-case for URL - replace spaces with hyphens and lowercase
      const categoryForUrl = category.toLowerCase().replace(/\s+/g, '-');
      
      // Always use the public endpoint as it works with or without authentication
      const endpoint = `/chat/public/${encodeURIComponent(categoryForUrl)}`;
      
      console.log(`Using public chat endpoint: ${endpoint}`);
      
      // Enhanced request with timeout and retry logic
      const makeRequest = async (retryCount = 0) => {
        try {
          return await axiosInstance.post(endpoint, {
            query,
            category, // Send original category string in the body
            language: language || 'English',
            session_id: sessionId,
            messages: messageHistory // Include the message history
          }, {
            timeout: 60000 // 60 second timeout for chat requests
          });
        } catch (error) {
          console.error(`Request attempt ${retryCount + 1} failed:`, error);
          
          // Only retry network errors and certain server errors
          if ((error.message === 'Network Error' || 
               (error.response && error.response.status >= 500)) && 
              retryCount < 2) {
            console.log(`Retrying request (${retryCount + 1}/2) after ${(retryCount + 1) * 2000}ms...`);
            // Wait for increasing amount of time before retrying
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
            return makeRequest(retryCount + 1);
          }
          throw error;
        }
      };
      
      const response = await makeRequest();
      
      console.log("Message response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Send message error:", error);
      
      // Provide user-friendly error messages
      if (error.response) {
        // Server responded with error
        if (error.response.status === 400) {
          if (error.response.data.detail?.includes('Invalid category')) {
            throw new Error(`Category not found. Please select a valid category from the dropdown.`);
          } else {
            throw new Error(error.response.data.detail || "Invalid request parameters");
          }
        } else if (error.response.status === 401) {
          throw new Error("You need to be logged in to use this feature");
        } else if (error.response.status === 429) {
          throw new Error("You've reached the rate limit. Please wait a moment before sending more messages");
        } else if (error.response.status >= 500) {
          throw new Error("The server encountered an error. Our team has been notified");
        }
      }
      
      // Network or timeout errors
      if (error.code === 'ECONNABORTED') {
        throw new Error("Request timed out. The AI might be taking too long to respond");
      }
      
      if (error.message === 'Network Error') {
        throw new Error("Cannot connect to the server. Please check your internet connection");
      }
      
      // Use the original error message if available, or a generic message
      throw new Error(
        error.message || "There was a problem sending your message. Please try again"
      );
    }
  },
};

export default api;
