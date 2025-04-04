import React, { useState, useRef, useEffect } from 'react';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm NyayGuru, your legal assistant. How can I help you today?", sender: 'bot', timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [category, setCategory] = useState('Criminal Law'); // Default category
  const [testResult, setTestResult] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize session on component mount
  useEffect(() => {
    // Create a session ID if not already created
    if (!sessionId) {
      const newSessionId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message to API and handle response
  const sendMessageToAPI = async (text) => {
    try {
      console.log(`Sending request to API with session ID: ${sessionId}`);
      console.log(`Category: ${category}`);
      
      // Format the category for the URL
      const categoryPath = category.toLowerCase().replace(/ /g, '-');
      const apiUrl = `http://localhost:8000/api/chat/public/${categoryPath}`;
      console.log(`API URL: ${apiUrl}`);
      
      const requestBody = {
        query: text,
        category: category,
        language: 'English',
        session_id: sessionId
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.statusText}. Details:`, errorText);
        throw new Error(`API error: ${response.statusText}. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);

      // Add bot message with structured data
      const botResponse = {
        id: messages.length + 2,
        text: data.answer,
        sender: 'bot',
        timestamp: new Date(),
        sources: data.sources || [],
        messageType: data.message_type || 'answer'
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
      
      // Update suggested questions
      if (data.suggested_questions && data.suggested_questions.length > 0) {
        setSuggestedQuestions(data.suggested_questions);
      }
      
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message to API:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 2,
        text: `Sorry, I'm having trouble processing your request right now. Please try again later. Error: ${error.message}`,
        sender: 'bot',
        timestamp: new Date(),
        messageType: 'error'
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setIsTyping(false);
    }
  };

  // Handle sending a message
  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    // Add user message
    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Send to API
    sendMessageToAPI(inputText);
  };

  // Handle file upload
  const handleFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Add file message - for future document analysis feature
      const fileMessage = {
        id: messages.length + 1,
        text: `Uploaded: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        isFile: true,
        fileName: file.name
      };
      
      setMessages([...messages, fileMessage]);
      
      // Clear file input
      e.target.value = null;
      
      // Show typing indicator
      setIsTyping(true);
      
      // Add placeholder response for now
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: "I've received your document. Document analysis is coming soon!",
          sender: 'bot',
          timestamp: new Date(),
          messageType: 'info'
        };
        
        setMessages(prevMessages => [...prevMessages, botResponse]);
        setIsTyping(false);
      }, 1500);
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  // Test API connection
  const testApiConnection = async () => {
    try {
      // First test the basic endpoint
      const testResponse = await fetch('http://localhost:8000/api/chat/test', {
        method: 'GET',
      });
      const testData = await testResponse.json();
      console.log('Basic API test response:', testData);
      
      // Then test category handling
      const formattedCategory = category.toLowerCase().replace(/ /g, '-');
      const catTestResponse = await fetch(`http://localhost:8000/api/chat/test-cat/${formattedCategory}`, {
        method: 'POST',
      });
      const catData = await catTestResponse.json();
      console.log('Category test response:', catData);
      
      // Add a success message
      const testMessage = {
        id: messages.length + 1,
        text: `API Connection Test: SUCCESS\n\nDetected categories: ${testData.categories.join(', ')}\n\nCategory '${formattedCategory}' normalized to: ${catData.matched_category || 'Not found'}`,
        sender: 'bot',
        timestamp: new Date(),
        messageType: 'info'
      };
      
      setMessages(prevMessages => [...prevMessages, testMessage]);
      setTestResult('success');
    } catch (error) {
      console.error('API test error:', error);
      
      // Add error message
      const errorMessage = {
        id: messages.length + 1,
        text: `API Connection Test: FAILED\n\nError: ${error.message}\n\nPlease make sure the API server is running at http://localhost:8000`,
        sender: 'bot',
        timestamp: new Date(),
        messageType: 'error'
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      setTestResult('failed');
    }
  };

  return (
    <div className="chat-interface">
      {/* Header - Modernized with cleaner design */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-logo">
            <i className="bi bi-stars"></i>
            <h2>NyayGuru</h2>
          </div>
          <div className="status">
            <span className="status-indicator"></span>
            <span className="status-text">Online</span>
          </div>
        </div>
        <div className="header-actions">
          <select 
            className="category-select" 
            value={category} 
            onChange={handleCategoryChange}
            title="Select legal category"
          >
            <option value="Criminal Law">Criminal Law</option>
            <option value="Civil Law">Civil Law</option>
            <option value="Family Law">Family Law</option>
            <option value="Corporate Law">Corporate Law</option>
            <option value="Property Law">Property Law</option>
          </select>
          <button className="header-action-btn" title="Test API connection" onClick={testApiConnection}>
            <i className="bi bi-lightning"></i>
          </button>
          <button className="header-action-btn" title="Clear chat" onClick={() => setMessages([messages[0]])}>
            <i className="bi bi-trash3"></i>
          </button>
          <button className="header-action-btn" title="Settings">
            <i className="bi bi-gear"></i>
          </button>
        </div>
      </div>

      {/* Messages Container - Updated with more modern styling */}
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message-wrapper ${message.sender === 'user' ? 'user-message-wrapper' : 'bot-message-wrapper'}`}
          >
            {message.sender === 'bot' && (
              <div className="avatar bot-avatar">
                <i className="bi bi-robot"></i>
              </div>
            )}
            
            <div className={`message ${message.sender}-message ${message.messageType === 'error' ? 'error-message' : ''}`}>
              {message.isFile ? (
                <div className="file-content">
                  <i className="bi bi-file-earmark-text"></i>
                  <span>{message.fileName}</span>
                </div>
              ) : (
                <div className="message-text">{message.text}</div>
              )}
              
              {/* Show sources if available */}
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <p className="sources-title">Sources:</p>
                  <ul className="sources-list">
                    {message.sources.map((source, idx) => (
                      <li key={idx}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="message-timestamp">{formatTime(message.timestamp)}</div>
            </div>
            
            {message.sender === 'user' && (
              <div className="avatar user-avatar">
                <i className="bi bi-person"></i>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing indicator with updated animation */}
        {isTyping && (
          <div className="message-wrapper bot-message-wrapper">
            <div className="avatar bot-avatar">
              <i className="bi bi-robot"></i>
            </div>
            <div className="message bot-message typing-indicator-container">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="quick-replies">
        {suggestedQuestions.map((question, index) => (
          <button 
            key={index} 
            className="quick-reply-btn"
            onClick={() => {
              setInputText(question);
            }}
          >
            {question}
          </button>
        ))}
      </div>

      {/* Input Area - Redesigned with modern controls */}
      <div className="chat-input-area">
        <button 
          className="attachment-btn input-action-btn"
          onClick={handleFileUpload}
          title="Attach file"
        >
          <i className="bi bi-paperclip"></i>
        </button>
        
        <div className="input-container">
          <input
            type="text"
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            className="message-input"
          />
          
          <button 
            className="voice-btn input-action-btn"
            title="Voice input"
          >
            <i className="bi bi-mic"></i>
          </button>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
        />
        
        <button 
          className={`send-btn ${!inputText.trim() ? 'disabled' : ''}`}
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          title="Send message"
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface; 