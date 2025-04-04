import React, { useState, useRef, useEffect } from 'react';
import '../styles/ModernChatInterface.css';
import '../styles/App.css';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

const ModernChatInterface = ({ initialQuery, initialCategory }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm NyayGuru, your legal assistant. How can I help you today?", sender: 'bot', timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState(initialQuery || '');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [category, setCategory] = useState(initialCategory || 'General');
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState({});
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [error, setError] = useState(null);
  const [initialQueryProcessed, setInitialQueryProcessed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize session and fetch categories
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Create a new session
        const sessionResponse = await api.createSession();
        setSessionId(sessionResponse.session_id);
        console.log("Session created:", sessionResponse.session_id);
        
        // Fetch available categories
        const categoriesResponse = await api.fetchCategories();
        setCategories(categoriesResponse.categories);
        console.log("Categories loaded:", categoriesResponse.categories);
        
        // Set default category or use the initialCategory if provided
        if (initialCategory && categoriesResponse.categories) {
          // If initialCategory is in kebab-case (e.g., "criminal-law"), convert to proper case
          const normalizedCategory = initialCategory.replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          
          console.log("Normalized category:", normalizedCategory);
          
          // Find a matching category (case insensitive)
          const matchedCategory = categoriesResponse.categories.find(
            cat => cat.toLowerCase() === normalizedCategory.toLowerCase()
          );
          
          if (matchedCategory) {
            console.log("Matched category:", matchedCategory);
            setCategory(matchedCategory);
          } else if (categoriesResponse.categories.length > 0) {
            // Special case for "know-your-rights"
            if (initialCategory.toLowerCase() === "know-your-rights" &&
                categoriesResponse.categories.some(cat => cat.toLowerCase() === "know your rights")) {
              const rightsCat = categoriesResponse.categories.find(
                cat => cat.toLowerCase() === "know your rights"
              );
              console.log("Using special case matching for rights category:", rightsCat);
              setCategory(rightsCat);
            } else {
              // Fallback to first available category
              console.log("No matching category, using first available:", categoriesResponse.categories[0]);
              setCategory(categoriesResponse.categories[0]);
            }
          }
        } else if (categoriesResponse.categories && categoriesResponse.categories.length > 0) {
          console.log("Using default first category:", categoriesResponse.categories[0]);
          setCategory(categoriesResponse.categories[0]);
        }
        
        // Fetch available languages
        const languagesResponse = await api.fetchLanguages();
        setLanguages(languagesResponse.languages || {});
        console.log("Languages loaded:", Object.keys(languagesResponse.languages || {}));
      } catch (err) {
        console.error("Chat initialization error:", err);
        setError("Failed to initialize chat. Please refresh the page.");
      }
    };
    
    initializeChat();
    
    // Setup dark mode listener
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleDarkModeChange = (e) => {
      setIsDarkMode(e.matches);
      // Apply dark mode to parent layout
      document.querySelector('.chat-layout')?.classList.toggle('dark-mode', e.matches);
    };
    
    // Initial setup - ensure light mode is applied
    document.querySelector('.chat-layout')?.classList.remove('dark-mode');
    
    darkModeMediaQuery.addEventListener('change', handleDarkModeChange);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, [initialCategory]);

  // Process initial query if provided
  useEffect(() => {
    const processInitialQuery = async () => {
      if (initialQuery && sessionId && category && !initialQueryProcessed) {
        console.log("Processing initial query:", initialQuery);
        setInitialQueryProcessed(true);
        await handleSendMessage(initialQuery);
      }
    };

    processInitialQuery();
  }, [initialQuery, sessionId, category, initialQueryProcessed]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height
      textareaRef.current.style.height = "auto";
      // Set new height based on scrollHeight
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [inputText]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle language change
  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    
    // Add system message about language change
    const languageMessage = {
      id: uuidv4(),
      text: `Language changed to ${language}. I'll respond in ${language} from now on.`,
      sender: 'bot',
      timestamp: new Date(),
      isSystem: true
    };
    
    setMessages(prevMessages => [...prevMessages, languageMessage]);
  };

  // Toggle dark mode manually
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    // Apply dark mode to parent layout
    document.querySelector('.chat-layout')?.classList.toggle('dark-mode', newDarkMode);
  };

  // Handle sending a message
  const handleSendMessage = async (text = inputText) => {
    if (!text.trim() || !sessionId) return;
    
    // Add user message
    const userMessage = {
      id: uuidv4(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      console.log(`Sending message with category: ${category}`);
      
      // Send message to the API
      const response = await api.sendMessage(
        text,
        category,
        currentLanguage,
        sessionId
      );
      
      // Add bot message with the response
      const botResponse = {
        id: uuidv4(),
        text: response.answer,
        sender: 'bot',
        timestamp: new Date(),
        sources: response.sources || [],
        suggestedQuestions: response.suggested_questions || []
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (err) {
      console.error("Failed to send message:", err);
      
      // Add error message
      const errorMessage = {
        id: uuidv4(),
        text: err.message || "Sorry, I couldn't process your request. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      
      // Add a suggestion to try another category if it seems related to category issues
      if (err.message && (
          err.message.includes("category") || 
          err.message.includes("Category") ||
          err.message.includes("not related")
      )) {
        const suggestMessage = {
          id: uuidv4(),
          text: "You might want to try selecting a different legal category from the dropdown below that better matches your question.",
          sender: 'bot',
          timestamp: new Date(),
          isSystem: true
        };
        
        setMessages(prevMessages => [...prevMessages, suggestMessage]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Add file message
      const fileMessage = {
        id: uuidv4(),
        text: `Uploaded: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        isFile: true,
        fileName: file.name
      };
      
      setMessages(prevMessages => [...prevMessages, fileMessage]);
      
      // Clear file input
      e.target.value = null;
      
      // Show typing indicator
      setIsTyping(true);
      
      try {
        // Simulate file processing (in a real app, you'd upload and process the file)
        setTimeout(() => {
          const responseMessage = {
            id: uuidv4(),
            text: `I've received your file: ${file.name}. I'll analyze it and provide insights soon.`,
            sender: 'bot',
            timestamp: new Date()
          };
          
          setMessages(prevMessages => [...prevMessages, responseMessage]);
          setIsTyping(false);
        }, 1500);
      } catch (err) {
        console.error("File processing error:", err);
        setIsTyping(false);
        
        const errorMessage = {
          id: uuidv4(),
          text: "Sorry, I couldn't process your file. Please try again with a different file.",
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        };
        
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    }
  };

  // Simulate voice recording (in a real app, would use Web Speech API)
  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Simulate a 2-second recording
      setTimeout(() => {
        setIsRecording(false);
        setInputText(prev => prev + " [Voice transcription would appear here]");
        textareaRef.current?.focus();
      }, 2000);
    }
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setCategory(newCategory);
    
    // Add system message about category change
    const categoryMessage = {
      id: uuidv4(),
      text: `Category changed to ${newCategory}. You can now ask questions related to ${newCategory}.`,
      sender: 'bot',
      timestamp: new Date(),
      isSystem: true
    };
    
    setMessages(prevMessages => [...prevMessages, categoryMessage]);
  };

  // Handle key press in the input field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() && !isTyping) {
        handleSendMessage();
      }
    }
  };

  // Handle clicking on a suggested question
  const handleSuggestedQuestionClick = (question) => {
    setInputText(question);
    // Optionally auto-send
    // handleSendMessage(question);
  };

  // Format message timestamp
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      
      const today = new Date();
      const isToday = date.getDate() === today.getDate() && 
                     date.getMonth() === today.getMonth() && 
                     date.getFullYear() === today.getFullYear();
      
      const timeOptions = { hour: '2-digit', minute: '2-digit' };
      const timeStr = date.toLocaleTimeString(undefined, timeOptions);
      
      if (isToday) {
        return `Today at ${timeStr}`;
      } else {
        const dateOptions = { month: 'short', day: 'numeric' };
        const dateStr = date.toLocaleDateString(undefined, dateOptions);
        return `${dateStr} at ${timeStr}`;
      }
    } catch (e) {
      console.error("Error formatting timestamp:", e);
      return '';
    }
  };

  // Render message sources
  const renderSources = (sources) => {
    if (!sources || sources.length === 0) return null;
    
    return (
      <div className="modern-message-sources">
        <div className="modern-sources-title">
          <i className="bi bi-journal-text"></i> Sources & References
        </div>
        <ul>
          {sources.map((source, index) => (
            <li key={index}>
              {source.title || source.name || "Legal Source"}
              {source.url && (
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  View Source <i className="bi bi-box-arrow-up-right"></i>
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render suggested questions
  const renderSuggestedQuestions = (questions) => {
    if (!questions || questions.length === 0) return null;
    
    return (
      <div className="modern-suggested-questions">
        <div className="modern-suggestions-title">
          <i className="bi bi-lightbulb"></i> Related Questions
        </div>
        <div className="modern-suggestions-list">
          {questions.map((question, index) => (
            <button
              key={index}
              className="modern-suggestion-btn"
              onClick={() => handleSuggestedQuestionClick(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Clear chat messages
  const clearChat = () => {
    setMessages([
      { 
        id: uuidv4(), 
        text: `Welcome to the ${category} legal assistant. How can I help you today?`, 
        sender: 'bot', 
        timestamp: new Date() 
      }
    ]);
  };

  return (
    <div className={`modern-chat-interface ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Chat Header */}
      <div className="modern-chat-header">
        <div className="modern-chat-title">
          <i className="bi bi-chat-dots-fill"></i>
          <span>{category ? `${category} Legal Assistant` : 'Legal Assistant'}</span>
        </div>
        
        <div className="modern-header-controls">
          <div className="modern-category-selector">
            <select 
              className="modern-category-select form-select"
              value={category}
              onChange={handleCategoryChange}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="modern-language-selector">
            <select 
              className="modern-language-select form-select"
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {Object.keys(languages).length > 0 ? (
                Object.keys(languages).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))
              ) : (
                <option value="English">English</option>
              )}
            </select>
          </div>
          
          <button 
            className="modern-mode-toggle" 
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={`bi ${isDarkMode ? 'bi-sun' : 'bi-moon'}`}></i>
          </button>
          
          <button 
            className="clear-chat-btn" 
            onClick={clearChat}
          >
            <i className="bi bi-eraser-fill"></i> Clear
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="modern-error-container">
          <i className="bi bi-exclamation-triangle-fill"></i>
          {error}
        </div>
      )}
      
      {/* Messages Container */}
      <div className="modern-messages-container">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`modern-message-wrapper modern-${message.sender}-message-wrapper`}
          >
            <div className={`modern-avatar modern-${message.sender}-avatar`}>
              {message.sender === 'bot' ? (
                <i className="bi bi-robot"></i>
              ) : (
                <i className="bi bi-person"></i>
              )}
            </div>
            
            <div className={`modern-message modern-${message.sender}-message ${message.isSystem ? 'modern-system-message' : ''} ${message.isError ? 'modern-error-message' : ''}`}>
              {message.isFile ? (
                <div className="modern-file-content">
                  <i className="bi bi-file-earmark-text"></i>
                  {message.text}
                </div>
              ) : (
                <div className="modern-message-text">{message.text}</div>
              )}
              
              {message.timestamp && (
                <div className="modern-message-timestamp">
                  {formatTimestamp(message.timestamp)}
                </div>
              )}
              
              {message.sender === 'bot' && renderSources(message.sources)}
              {message.sender === 'bot' && renderSuggestedQuestions(message.suggestedQuestions)}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="modern-message-wrapper modern-bot-message-wrapper">
            <div className="modern-avatar modern-bot-avatar">
              <i className="bi bi-robot"></i>
            </div>
            <div className="modern-message modern-bot-message">
              <div className="modern-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        {/* Element to scroll to */}
        <div ref={messagesEndRef}></div>
      </div>
      
      {/* Input Area */}
      <div className="modern-input-area">
        <div className={`modern-input-container ${isFocused ? 'focused' : ''} ${isRecording ? 'recording' : ''}`}>
          <textarea
            ref={textareaRef}
            className="modern-message-input"
            placeholder={isRecording ? "Listening..." : "Type your legal question here..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isTyping || isRecording}
            rows="1"
          ></textarea>
          
          <button 
            className={`modern-attachment-btn ${isRecording ? 'active' : ''}`}
            onClick={toggleVoiceRecording}
            disabled={isTyping}
          >
            <i className={`bi ${isRecording ? 'bi-mic-fill' : 'bi-mic'}`}></i>
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange} 
            accept=".pdf,.doc,.docx,.txt"
          />
          
          <button 
            className="modern-attachment-btn"
            onClick={handleFileUpload}
            disabled={isTyping || isRecording}
          >
            <i className="bi bi-paperclip"></i>
          </button>
          
          <button 
            className={`modern-send-btn ${(!inputText.trim() || isTyping) ? 'modern-disabled' : ''}`}
            onClick={() => {
              if (inputText.trim() && !isTyping) {
                handleSendMessage();
              }
            }}
            disabled={!inputText.trim() || isTyping}
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
        <p className="input-help-text">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
};

export default ModernChatInterface; 