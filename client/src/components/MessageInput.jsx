import React, { useState, useRef, useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';
import './MessageInput.css';

const MessageInput = ({ placeholder = 'Type a message...' }) => {
  const { handleSendMessage, handleTyping, currentUser, currentRoom } = useSocketContext();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      handleTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      handleTyping(false);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() && !selectedFile) return;

    // Stop typing indicator
    setIsTyping(false);
    handleTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    let fileData = null;

    // Upload file if selected
    if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          fileData = await response.json();
        } else {
          console.error('File upload failed');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    // Send message
    handleSendMessage(message.trim(), fileData);
    
    // Reset form
    setMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="message-input-container">
      {selectedFile && (
        <div className="file-preview">
          <span className="file-name">
            📎 {selectedFile.name}
            <button className="remove-file" onClick={removeFile}>
              ✕
            </button>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-actions">
          <label htmlFor="file-input" className="file-input-label" title="Attach file">
            📎
          </label>
          <input
            id="file-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="file-input"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </div>

        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="message-input"
          maxLength={1000}
        />

        <button
          type="submit"
          className="send-button"
          disabled={!message.trim() && !selectedFile}
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

