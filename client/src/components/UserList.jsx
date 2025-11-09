import React, { useState } from 'react';
import { useSocketContext } from '../context/SocketContext';
import './UserList.css';

const UserList = () => {
  const { users, currentRoom, currentUser, handleSendPrivateMessage } = useSocketContext();
  const [selectedUser, setSelectedUser] = useState(null);

  const roomUsers = users.filter((u) => u.currentRoom === currentRoom);

  const handleUserClick = (user) => {
    if (user.id === currentUser?.id) return;
    setSelectedUser(user);
  };

  const handlePrivateMessage = (userId, message) => {
    handleSendPrivateMessage(userId, message);
    setSelectedUser(null);
  };

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Users ({roomUsers.length})</h3>
      </div>

      <div className="user-list-content">
        {roomUsers.length === 0 ? (
          <div className="empty-users">No users in this room</div>
        ) : (
          roomUsers.map((user) => (
            <div
              key={user.id}
              className={`user-item ${user.id === currentUser?.id ? 'current-user' : ''}`}
              onClick={() => handleUserClick(user)}
            >
              <div className="user-avatar">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-info">
                <span className="user-name">
                  {user.username}
                  {user.id === currentUser?.id && ' (You)'}
                </span>
                <span className="user-status">🟢 Online</span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedUser && (
        <div className="private-message-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Send private message to {selectedUser.username}</h3>
              <button
                className="modal-close"
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>
            <PrivateMessageForm
              userId={selectedUser.id}
              username={selectedUser.username}
              onSubmit={handlePrivateMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const PrivateMessageForm = ({ userId, username, onSubmit }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(userId, message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="private-message-form">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Message ${username}...`}
        className="private-message-input"
        autoFocus
      />
      <button type="submit" className="private-message-send" disabled={!message.trim()}>
        Send
      </button>
    </form>
  );
};

export default UserList;

