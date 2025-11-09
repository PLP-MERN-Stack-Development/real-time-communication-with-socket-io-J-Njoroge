import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';
import ChatRoom from '../components/ChatRoom';
import UserList from '../components/UserList';
import RoomSelector from '../components/RoomSelector';
import PrivateMessage from '../components/PrivateMessage';
import './Chat.css';

const Chat = () => {
  const { currentUser, isConnected, logout } = useSocketContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>💬 Real-Time Chat</h1>
        <div className="header-info">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <span className="username">👤 {currentUser.username}</span>
          <button className="logout-button" onClick={() => { logout(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </div>

      <div className="chat-layout">
        <div className="chat-sidebar">
          <RoomSelector />
          <UserList />
        </div>

        <div className="chat-main">
          <ChatRoom />
        </div>

        <div className="chat-sidebar-right">
          <PrivateMessage />
        </div>
      </div>
    </div>
  );
};

export default Chat;

