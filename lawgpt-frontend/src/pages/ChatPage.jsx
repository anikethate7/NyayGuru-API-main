import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import CategoryTabs from "./CategoryTabs";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import LoadingSpinner from "./LoadingSpinner";
import "../styles/App.css";
import "../styles/Chat.css";

const ChatPage = () => {
  const { category: urlCategory } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId, categories, languages, loading: sessionLoading, error: sessionError } = useSession();
  const { currentUser, loading: authLoading, checkAuthStatus, setCurrentUser } = useAuth();
  
  // Get query parameter if coming from home page search
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('query');

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: "Hello! I'm NyayGuru, your legal assistant. Select a legal category and ask me a question.",
      sender: "bot",
      sources: [],
      timestamp: new Date().toISOString(),
    },
  ]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState("English");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [inputText, setInputText] = useState(searchQuery || "");
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(null);

  // Check if user is logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      // Add message to login if not logged in
      setMessages((prev) => {
        // Only add this message if it doesn't already exist
        if (!prev.some(msg => msg.id === "login-required")) {
          return [
            ...prev,
            {
              id: "login-required",
              text: "Please log in to use the chat feature. You'll need to authenticate to send messages.",
              sender: "bot",
              isInfo: true,
              timestamp: new Date().toISOString(),
            },
          ];
        }
        return prev;
      });
    }
  }, [authLoading, currentUser]);

  // If there's a search query from home page, auto-submit it after component mounts
  useEffect(() => {
    if (searchQuery && categories.length > 0 && !isProcessing && currentUser) {
      // Set a default category for search queries
      setCurrentCategory(categories[0]);
      // Auto-submit the query after a short delay
      const timer = setTimeout(() => {
        handleSendMessage(searchQuery);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, categories, isProcessing, currentUser]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
      if (window.innerWidth > 992) {
        setSidebarExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };

  // Handle URL category parameter
  useEffect(() => {
    if (categories.length > 0 && urlCategory) {
      // Find the category that matches the URL parameter (case insensitive)
      const matchedCategory = categories.find(
        (cat) => cat.toLowerCase() === urlCategory.toLowerCase()
      );

      if (matchedCategory) {
        setCurrentCategory(matchedCategory);
      } else {
        // If category in URL doesn't exist, navigate to base path
        navigate("/");
      }
    }
  }, [urlCategory, categories, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    // Update the URL without redirecting away from the chat page
    // To prevent navigation to home page, we won't use navigate() here
    const path = `/category/${category.toLowerCase().replace(/\s+/g, "-")}`;
    window.history.pushState(null, '', path);

    // Add category selection message
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: `You are now in the "${category}" category. Please ask a relevant question.`,
        sender: "bot",
        sources: [],
        timestamp: new Date().toISOString(),
      },
    ]);

    // Close sidebar on mobile after selecting category
    if (isMobile) {
      setSidebarExpanded(false);
    }
  };

  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    
    // Send notification message about language change
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: `Language switched to ${language}. All responses will now be in ${language}.`,
        sender: "bot",
        sources: [],
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || !sessionId || !currentCategory) {
      setError("Please select a category and enter a message");
      return;
    }

    // Clear any previous errors
    setError(null);
    
    // No need to verify authentication status before sending
    // since we're using the public endpoint

    // Add user message to chat
    const userMessageId = Date.now().toString();
    const userTimestamp = new Date().toISOString();
    
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        text,
        sender: "user",
        timestamp: userTimestamp,
      },
    ]);

    // Add loading message
    const loadingId = `loading-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        text: "Generating response...",
        sender: "bot",
        isLoading: true,
        timestamp: new Date().toISOString(),
      },
    ]);

    setIsProcessing(true);

    try {
      console.log("Sending message:", {
        text,
        category: currentCategory,
        language: currentLanguage,
        sessionId
      });

      // Format message history for the API
      const messageHistory = messages
        .filter(msg => !msg.isLoading && !msg.isInfo && msg.id !== "welcome")
        .map(msg => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text
        }));

      // Add a timeout to cancel the request if it takes too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await api.sendMessage(
        text,
        currentCategory,
        currentLanguage,
        sessionId,
        messageHistory
      );
      
      clearTimeout(timeoutId);
      console.log("Response received:", response);

      // Remove loading message and add actual response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== loadingId)
          .concat({
            id: Date.now().toString(),
            text: response.answer,
            sender: "bot",
            sources: response.sources || [],
            timestamp: new Date().toISOString(),
          })
      );
    } catch (error) {
      console.error("Message sending failed:", error);
      
      let errorMessage = "Failed to send your message. Please try again.";
      
      // Handle specific error cases
      if (error.message.includes("timeout") || error.message.includes("timed out")) {
        errorMessage = "The response took too long. The server might be busy.";
      } else if (error.message.includes("connect") || error.message.includes("network")) {
        errorMessage = "Network connection issue. Please check your internet connection.";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "You've reached the message limit. Please wait a moment before sending more messages.";
      } else if (error.message.includes("need to be logged in") || error.message.includes("logged in")) {
        // Since we're now using the public endpoint, this shouldn't happen anymore
        // But in case it does, we'll display the guest login prompt instead of redirecting
        errorMessage = "You need to be logged in for full features. Please log in or continue as guest.";
        setError("Authentication required. Please log in or continue as guest.");
      } else if (error.message) {
        // Use the error message from the API if available
        errorMessage = error.message;
      }

      // Remove loading message and add error message
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== loadingId)
          .concat({
            id: Date.now().toString(),
            text: `Error: ${errorMessage}`,
            sender: "bot",
            isError: true,
            timestamp: new Date().toISOString(),
          })
      );

      // If authentication error, prompt to login
      if (error.response?.status === 401 || errorMessage.includes("log in")) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Your session has expired. Please log in again.",
            sender: "bot",
            isError: true,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        text: `Welcome to the ${currentCategory || "NyayGuru"} chat. How can I assist you today?`,
        sender: "bot",
        sources: [],
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSendClick = () => {
    if (inputText.trim()) {
      handleSendMessage(inputText);
      setInputText("");
    }
  };

  // Handle quick reply selections
  const handleQuickReplyClick = (replyText) => {
    setInputText(replyText);
    // Optional: Automatically send the quick reply
    // handleSendMessage(replyText);
  };

  // New guest login function
  const handleGuestLogin = async () => {
    try {
      setIsProcessing(true);
      // Create a random guest user email
      const guestEmail = `guest_${Math.random().toString(36).substring(2, 10)}@example.com`;
      const guestPassword = 'Password123!';
      
      // First try to register the guest
      try {
        await api.register({
          username: guestEmail.split('@')[0],
          email: guestEmail,
          password: guestPassword
        });
        console.log("Guest registration successful");
      } catch (err) {
        console.log("Guest registration failed, will try login instead:", err);
      }
      
      // Now try to login
      try {
        const userData = await api.login(guestEmail, guestPassword);
        // Store user data in localStorage directly to ensure auth state is updated
        localStorage.setItem("authToken", userData.token);
        localStorage.setItem("user", JSON.stringify(userData.user));
        
        // Add success message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "You are now logged in as a guest user. You can start chatting!",
            sender: "bot",
            isInfo: true,
            timestamp: new Date().toISOString(),
          },
        ]);
        
        // Clear any previous errors
        setError(null);
      } catch (err) {
        console.error("Guest login failed:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: "Failed to create guest account. Please try regular login instead.",
            sender: "bot",
            isError: true,
            timestamp: new Date().toISOString(),
          },
        ]);
        setError("Guest login failed. Please try regular login.");
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // We'll add this below the error message in the JSX
  const GuestLoginPrompt = () => (
    !currentUser && (
      <div className="guest-login-prompt">
        <p>You can use basic features without logging in, but for the best experience:</p>
        <button 
          className="guest-login-button" 
          onClick={handleGuestLogin}
          disabled={isProcessing}
        >
          {isProcessing ? "Creating guest account..." : "Continue as Guest"}
        </button>
        <span className="login-options">
          or <Link to="/login">Login</Link> / <Link to="/signup">Sign up</Link>
        </span>
      </div>
    )
  );

  return (
    <div className="chat-page-main">
      {sessionLoading || authLoading ? (
        <LoadingSpinner message="Initializing chat..." />
      ) : sessionError ? (
        <div className="error-container">
          <h2>Failed to initialize chat</h2>
          <p>{sessionError}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Reload Page
          </button>
        </div>
      ) : (
        <div className={`app-container ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
          <div className={`sidebar ${sidebarExpanded ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Legal Categories</h3>
              <button className="mobile-toggle" onClick={toggleSidebar}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="category-list">
              <ul>
                {categories.map((category) => (
                  <li
                    key={category}
                    className={currentCategory === category ? "active" : ""}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sidebar-footer">
              <div className="language-selector">
                <label htmlFor="language-select">Response Language</label>
                <select
                  id="language-select"
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="form-select"
                >
                  {Array.isArray(languages) 
                    ? languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))
                    : Object.keys(languages || {}).map((lang) => (
                        <option key={lang} value={lang}>
                          {lang}
                        </option>
                      ))
                  }
                </select>
              </div>
            </div>
          </div>

          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-header-title">
                <i className="bi bi-chat-dots-fill"></i>
                <h2>
                  {currentCategory
                    ? `${currentCategory} Legal Assistant`
                    : "Legal Assistant"}
                </h2>
              </div>
              <button className="clear-chat-btn" onClick={clearChat}>
                <i className="bi bi-eraser-fill"></i> Clear Chat
              </button>
            </div>

            {error && (
              <div className="error-message">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}
            
            {/* Add the guest login prompt */}
            <GuestLoginPrompt />

            <div className="chat-messages-container" ref={chatMessagesRef}>
              <div className="messages-list">
                {messages.map((msg) => (
                  <ChatMessages
                    key={msg.id}
                    message={msg}
                    onQuickReplyClick={handleQuickReplyClick}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <ChatInput
              inputText={inputText}
              setInputText={setInputText}
              handleSendClick={handleSendClick}
              isProcessing={isProcessing}
              isCategorySelected={!!currentCategory}
              isLoggedIn={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
