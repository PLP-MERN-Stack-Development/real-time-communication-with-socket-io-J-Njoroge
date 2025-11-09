import React from 'react';
import './MessageReactions.css';

const MessageReactions = ({ reactions, onReactionClick, currentUserId }) => {
  if (!reactions || Object.keys(reactions).length === 0) {
    return null;
  }

  return (
    <div className="message-reactions">
      {Object.entries(reactions).map(([emoji, userIds]) => {
        if (!userIds || userIds.length === 0) return null;
        
        const hasReacted = userIds.includes(currentUserId);
        
        return (
          <button
            key={emoji}
            className={`reaction-badge ${hasReacted ? 'reacted' : ''}`}
            onClick={() => onReactionClick(emoji)}
            title={`${userIds.length} ${userIds.length === 1 ? 'reaction' : 'reactions'}`}
          >
            <span className="reaction-emoji">{emoji}</span>
            <span className="reaction-count">{userIds.length}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MessageReactions;

