import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import '../styles/ChatLayout.css';

// Import the modern chat interface
import ModernChatInterface from './ModernChatInterface';

const ChatLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category: urlCategory } = useParams();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('query');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Dummy data for chat history
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Property Law Questions', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: 2, title: 'Criminal Procedure Help', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: 3, title: 'Tax Filing Assistance', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) },
  ]);
  
  // Function to start a new chat
  const startNewChat = () => {
    // In a real implementation, this would create a new chat session
    console.log('Starting new chat');
    navigate('/chat');
  };
  
  // Format date for chat history
  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    
    // Today
    if (diff < 24 * 60 * 60 * 1000) {
      return 'Today';
    }
    
    // Yesterday
    if (diff < 48 * 60 * 60 * 1000) {
      return 'Yesterday';
    }
    
    // Format the date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };
  
  // Toggle sidebar collapse
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <i className="bi bi-scale"></i>
            <h1>NyayGURU</h1>
          </div>
          <button className="collapse-btn" onClick={toggleSidebar}>
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
          </button>
        </div>
        
        <div className="sidebar-content">
          {/* New Chat Button */}
          <button className="new-chat-btn" onClick={startNewChat}>
            <i className="bi bi-plus-lg"></i>
            <span>New Chat</span>
          </button>
          
          {/* Chat History */}
          <div className="chat-history">
            <h2 className="section-title">Recent Chats</h2>
            <ul className="chat-list">
              {chatHistory.map((chat) => (
                <li key={chat.id} className="chat-item">
                  <a href="#" className="chat-link">
                    <i className="bi bi-chat-left-text"></i>
                    <div className="chat-info">
                      <span className="chat-title">{chat.title}</span>
                      <span className="chat-date">{formatDate(chat.timestamp)}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      
      {/* Main Chat Area */}
      <main className="chat-main">
        <ModernChatInterface initialQuery={searchQuery} initialCategory={urlCategory} />
      </main>
    </div>
  );
};

export default ChatLayout; 