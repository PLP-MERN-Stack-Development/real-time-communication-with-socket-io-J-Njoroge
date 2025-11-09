import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../context/SocketContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('general');
  const [error, setError] = useState('');
  const { login, isConnected } = useSocketContext();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setError('');
    login(username.trim(), room);
    navigate('/chat');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">💬 Real-Time Chat</h1>
        <p className="login-subtitle">Join the conversation</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="form-input"
              autoFocus
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label htmlFor="room">Room</label>
            <select
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="form-input"
            >
              <option value="general">General</option>
              <option value="random">Random</option>
              <option value="tech">Tech</option>
              <option value="gaming">Gaming</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-button"
            disabled={!username.trim()}
          >
            {isConnected ? 'Join Chat' : 'Connecting...'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

