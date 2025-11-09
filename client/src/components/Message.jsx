import React, { useState } from 'react';
import { useSocketContext } from '../context/SocketContext';
import MessageReactions from './MessageReactions';
import './Message.css';

const Message = ({ message }) => {
  const { currentUser, addReaction, removeReaction } = useSocketContext();
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.senderId === currentUser?.id || message.sender === currentUser?.username;

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleReactionClick = (reaction) => {
    if (!message.reactions) {
      message.reactions = {};
    }
    
    const hasReacted = message.reactions[reaction]?.includes(currentUser?.id);
    
    if (hasReacted) {
      removeReaction(message.id, reaction);
    } else {
      addReaction(message.id, reaction);
    }
  };

  if (message.system) {
    return (
      <div className="message system-message">
        <p>{message.message}</p>
      </div>
    );
  }

  return (
    <div className={`message ${isOwnMessage ? 'own-message' : ''}`}>
      {!isOwnMessage && (
        <div className="message-avatar">
          {message.sender?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}

      <div className="message-content">
        {!isOwnMessage && (
          <div className="message-header">
            <span className="message-sender">{message.sender}</span>
            <span className="message-time">{formatTime(message.timestamp)}</span>
          </div>
        )}

        <div className="message-body">
          {message.file ? (
            <div className="message-file">
              {message.file.mimetype?.startsWith('image/') ? (
                <img
                  src={`http://localhost:5000${message.file.path}`}
                  alt={message.file.originalName}
                  className="message-image"
                />
              ) : (
                <a
                  href={`http://localhost:5000${message.file.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="message-file-link"
                >
                  📎 {message.file.originalName}
                </a>
              )}
            </div>
          ) : null}

          <p className="message-text">{message.message}</p>

          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              onReactionClick={handleReactionClick}
              currentUserId={currentUser?.id}
            />
          )}

          {!showReactions && (
            <button
              className="reaction-button"
              onClick={() => setShowReactions(true)}
              title="Add reaction"
            >
              😊
            </button>
          )}

          {showReactions && (
            <div className="reaction-picker">
              {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  className="reaction-emoji"
                  onClick={() => {
                    handleReactionClick(emoji);
                    setShowReactions(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
              <button
                className="reaction-close"
                onClick={() => setShowReactions(false)}
              >
                ✕
              </button>
            </div>
          )}

          {isOwnMessage && (
            <span className="message-time">{formatTime(message.timestamp)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;

