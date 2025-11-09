import React, { useState, useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatRoom.css';

const ChatRoom = () => {
  const {
    currentRoom,
    messages,
    typingUsers,
    users,
    isConnected,
    markMessageAsRead,
  } = useSocketContext();

  const [roomMessages, setRoomMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Filter messages for current room
  useEffect(() => {
    const filtered = messages.filter(
      (msg) => msg.room === currentRoom && !msg.isPrivate
    );
    setRoomMessages(filtered);
  }, [messages, currentRoom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  // Mark messages as read when viewing
  useEffect(() => {
    roomMessages.forEach((msg) => {
      if (msg.senderId && msg.senderId !== users.find(u => u.id === msg.senderId)?.id) {
        markMessageAsRead(msg.id);
      }
    });
  }, [roomMessages, markMessageAsRead, users]);

  const currentRoomUsers = users.filter((u) => u.currentRoom === currentRoom);

  return (
    <div className="chat-room">
      <div className="chat-room-header">
        <h2>#{currentRoom}</h2>
        <div className="room-info">
          <span className="user-count">{currentRoomUsers.length} users</span>
          {!isConnected && (
            <span className="reconnecting">Reconnecting...</span>
          )}
        </div>
      </div>

      <MessageList messages={roomMessages} typingUsers={typingUsers} />
      <div ref={messagesEndRef} />

      <MessageInput
        placeholder={`Message #${currentRoom}`}
      />
    </div>
  );
};

export default ChatRoom;

