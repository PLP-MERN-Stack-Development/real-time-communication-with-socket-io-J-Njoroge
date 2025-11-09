import React, { useState } from 'react';
import { useSocketContext } from '../context/SocketContext';
import './RoomSelector.css';

const RoomSelector = () => {
  const { availableRooms, currentRoom, changeRoom, unreadCounts } = useSocketContext();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleRoomChange = (room) => {
    changeRoom(room);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim() && !availableRooms.includes(newRoomName.trim().toLowerCase())) {
      // Room creation is handled by the server when joining
      changeRoom(newRoomName.trim().toLowerCase());
      setNewRoomName('');
      setShowCreateRoom(false);
    }
  };

  return (
    <div className="room-selector">
      <div className="room-selector-header">
        <h3>Rooms</h3>
        <button
          className="create-room-button"
          onClick={() => setShowCreateRoom(!showCreateRoom)}
          title="Create new room"
        >
          +
        </button>
      </div>

      {showCreateRoom && (
        <form onSubmit={handleCreateRoom} className="create-room-form">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="Room name"
            className="create-room-input"
            autoFocus
            maxLength={20}
          />
          <div className="create-room-actions">
            <button type="submit" className="create-room-submit" disabled={!newRoomName.trim()}>
              Create
            </button>
            <button
              type="button"
              className="create-room-cancel"
              onClick={() => {
                setShowCreateRoom(false);
                setNewRoomName('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="room-list">
        {availableRooms.map((room) => (
          <button
            key={room}
            className={`room-item ${room === currentRoom ? 'active' : ''}`}
            onClick={() => handleRoomChange(room)}
          >
            <span className="room-name">#{room}</span>
            {unreadCounts[room] > 0 && (
              <span className="room-unread">{unreadCounts[room]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector;

