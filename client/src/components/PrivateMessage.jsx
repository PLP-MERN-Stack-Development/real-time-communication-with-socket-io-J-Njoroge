import React, { useState, useEffect } from 'react';
import { useSocketContext } from '../context/SocketContext';
import Message from './Message';
import './PrivateMessage.css';

const PrivateMessage = () => {
  const { messages, currentUser, users, unreadCounts, handleSendPrivateMessage } = useSocketContext();
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [messageText, setMessageText] = useState('');

  // Get all users for private messaging
  const allUsers = users.filter((u) => u.id !== currentUser?.id);

  // Filter private messages for selected user
  useEffect(() => {
    if (selectedUser) {
      const filtered = messages.filter(
        (msg) =>
          msg.isPrivate &&
          ((msg.senderId === selectedUser.id && msg.receiverId === currentUser?.id) ||
            (msg.senderId === currentUser?.id && msg.receiverId === selectedUser.id))
      );
      setPrivateMessages(filtered);
    }
  }, [messages, selectedUser, currentUser]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && selectedUser) {
      handleSendPrivateMessage(selectedUser.id, messageText.trim());
      setMessageText('');
    }
  };

  return (
    <div className="private-message-panel">
      <div className="private-message-header">
        <h3>Private Messages</h3>
        {unreadCounts.private > 0 && (
          <span className="private-unread-badge">{unreadCounts.private}</span>
        )}
      </div>

      {!selectedUser ? (
        <div className="private-message-list">
          {allUsers.length === 0 ? (
            <div className="empty-private">No other users online</div>
          ) : (
            allUsers.map((user) => {
              const userPrivateMessages = messages.filter(
                (msg) =>
                  msg.isPrivate &&
                  ((msg.senderId === user.id && msg.receiverId === currentUser?.id) ||
                    (msg.senderId === currentUser?.id && msg.receiverId === user.id))
              );
              const lastMessage = userPrivateMessages[userPrivateMessages.length - 1];

              return (
                <div
                  key={user.id}
                  className="private-user-item"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="private-user-avatar">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="private-user-info">
                    <span className="private-user-name">{user.username}</span>
                    {lastMessage && (
                      <span className="private-last-message">
                        {lastMessage.message?.substring(0, 30)}
                        {lastMessage.message?.length > 30 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="private-chat-view">
          <div className="private-chat-header">
            <button
              className="back-button"
              onClick={() => setSelectedUser(null)}
            >
              ←
            </button>
            <div className="private-chat-user">
              <div className="private-chat-avatar">
                {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>{selectedUser.username}</span>
            </div>
          </div>

          <div className="private-messages-list">
            {privateMessages.length === 0 ? (
              <div className="empty-private-messages">
                No messages yet. Start the conversation!
              </div>
            ) : (
              privateMessages.map((message) => (
                <Message key={message.id} message={message} />
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="private-message-form">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message ${selectedUser.username}...`}
              className="private-message-input"
            />
            <button
              type="submit"
              className="private-message-send-button"
              disabled={!messageText.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PrivateMessage;

