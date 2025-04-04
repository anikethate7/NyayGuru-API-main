import React from "react";
import "../styles/Chat.css";

const ChatMessages = ({ message, onQuickReplyClick }) => {
  const { text, sender, timestamp, sources = [], suggestedQuestions = [], isLoading, isInfo } = message;

  // Format timestamp
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

  const renderSources = () => {
    if (!sources || sources.length === 0) return null;
    
    return (
      <div className="message-sources">
        <div className="source-title">Sources & References:</div>
        <ul className="source-list">
          {sources.map((source, index) => (
            <li key={index} className="source-item">
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

  return (
    <div className={`message-wrapper ${sender}-wrapper`}>
      <div className={`message-avatar ${sender}-avatar`}>
        {sender === "bot" ? (
          <i className="bi bi-robot"></i>
        ) : (
          <i className="bi bi-person"></i>
        )}
      </div>
      <div className={`message ${sender}-message ${isLoading ? 'loading' : ''} ${isInfo ? 'info' : ''}`}>
        <div className="message-content">
          {isLoading ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <>
              <div className="message-text">{text}</div>
              {timestamp && (
                <div className="message-time">{formatTimestamp(timestamp)}</div>
              )}
              {renderSources()}
              {suggestedQuestions && suggestedQuestions.length > 0 && (
                <div className="quick-replies">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="quick-reply-btn"
                      onClick={() => onQuickReplyClick(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
