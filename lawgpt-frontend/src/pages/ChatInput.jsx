import React, { useState, useRef, useEffect } from "react";
import "../styles/Chat.css";
import { Link } from "react-router-dom";

const ChatInput = ({
  inputText,
  setInputText,
  handleSendClick,
  isProcessing,
  isCategorySelected,
  isLoggedIn,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Focus input field when component mounts
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height
      textareaRef.current.style.height = "auto";
      // Set new height based on scrollHeight
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [inputText]);

  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  // Simulate voice recording 
  const toggleVoiceRecording = () => {
    // In a real implementation, this would start/stop speech recognition
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

  return (
    <div className="chat-input-container">
      {!isLoggedIn && (
        <div className="login-prompt">
          <small>
            You are using the public chat API. For extended features, consider 
            <Link to="/login"> logging in</Link> or <Link to="/signup">signing up</Link>.
          </small>
        </div>
      )}
      <div className={`input-wrapper ${isFocused ? "focused" : ""} ${isRecording ? 'recording' : ''}`}>
        <textarea
          ref={textareaRef}
          className="message-input"
          placeholder={
            !isCategorySelected
              ? "Please select a legal category first"
              : !isLoggedIn
              ? "Please log in to send messages"
              : isRecording 
              ? "Listening..."
              : "Type your legal question..."
          }
          value={inputText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={!isCategorySelected || !isLoggedIn || isProcessing || isRecording}
          rows="1"
        />
        <button 
          className={`mic-button ${isRecording ? 'active' : ''}`}
          onClick={toggleVoiceRecording}
          disabled={!isCategorySelected || !isLoggedIn || isProcessing}
        >
          <i className={`bi ${isRecording ? 'bi-mic-fill' : 'bi-mic'}`}></i>
        </button>
        <button
          className={`send-button ${isProcessing ? "processing" : ""}`}
          onClick={handleSendClick}
          disabled={!inputText.trim() || !isCategorySelected || !isLoggedIn || isProcessing}
        >
          {isProcessing ? (
            <i className="bi bi-arrow-clockwise"></i>
          ) : (
            <i className="bi bi-send-fill"></i>
          )}
        </button>
      </div>
      <p className="input-help-text">
        Press Enter to send, Shift+Enter for a new line
      </p>
    </div>
  );
};

export default ChatInput;
