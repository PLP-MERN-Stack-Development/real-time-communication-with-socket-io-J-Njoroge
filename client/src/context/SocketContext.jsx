import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../socket/socket';

const SocketContext = createContext();

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [availableRooms, setAvailableRooms] = useState(['general', 'random', 'tech', 'gaming']);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const {
    socket,
    isConnected,
    messages,
    users,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
  } = useSocket();

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  // Play sound notification
  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Fallback: create audio element if file doesn't exist
      const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      beep.volume = 0.3;
      beep.play().catch(() => {});
    });
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title, body, icon) => {
    if (notificationPermission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
      });
    }
  }, [notificationPermission]);

  // Handle user login
  const login = useCallback((username, room = 'general') => {
    setCurrentUser({ username, id: socket.id });
    setCurrentRoom(room);
    connect(username);
    socket.emit('user_join', { username, room });
  }, [connect, socket]);

  // Handle room change
  const changeRoom = useCallback((room) => {
    if (currentUser) {
      socket.emit('join_room', { room });
      setCurrentRoom(room);
      // Reset unread count for the new room
      setUnreadCounts(prev => ({ ...prev, [room]: 0 }));
    }
  }, [currentUser, socket]);

  // Handle sending message
  const handleSendMessage = useCallback((message, file = null) => {
    if (!currentUser) return;

    const messageData = {
      message,
      room: currentRoom,
    };

    if (file) {
      messageData.file = file;
    }

    sendMessage(messageData);
  }, [currentUser, currentRoom, sendMessage]);

  // Handle private message
  const handleSendPrivateMessage = useCallback((to, message) => {
    if (!currentUser) return;
    sendPrivateMessage(to, message);
  }, [currentUser, sendPrivateMessage]);

  // Handle typing indicator
  const handleTyping = useCallback((isTyping) => {
    if (!currentUser) return;
    setTyping(isTyping);
    socket.emit('typing', { isTyping, room: currentRoom });
  }, [currentUser, currentRoom, setTyping, socket]);

  // Handle read receipt
  const markMessageAsRead = useCallback((messageId) => {
    socket.emit('mark_read', { messageId, room: currentRoom });
  }, [socket, currentRoom]);

  // Handle message reaction
  const addReaction = useCallback((messageId, reaction) => {
    socket.emit('add_reaction', { messageId, reaction, room: currentRoom });
  }, [socket, currentRoom]);

  // Handle remove reaction
  const removeReaction = useCallback((messageId, reaction) => {
    socket.emit('remove_reaction', { messageId, reaction, room: currentRoom });
  }, [socket, currentRoom]);

  // Handle message search
  const searchMessages = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    socket.emit('search_messages', { query, room: currentRoom });
  }, [socket, currentRoom]);

  // Handle load more messages (pagination)
  const loadMoreMessages = useCallback((page) => {
    socket.emit('load_messages', { room: currentRoom, page, limit: 50 });
  }, [socket, currentRoom]);

  // Socket event listeners
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      // Update unread count if message is from another room or private
      if (message.room && message.room !== currentRoom) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.room]: (prev[message.room] || 0) + 1,
        }));
        
        // Play sound and show notification
        playNotificationSound();
        showBrowserNotification(
          `New message in ${message.room}`,
          `${message.sender}: ${message.message?.substring(0, 50)}...`,
        );
      } else if (message.isPrivate && message.senderId !== socket.id) {
        setUnreadCounts(prev => ({
          ...prev,
          private: (prev.private || 0) + 1,
        }));
        
        playNotificationSound();
        showBrowserNotification(
          `Private message from ${message.sender}`,
          message.message?.substring(0, 50),
        );
      } else if (message.senderId !== socket.id) {
        // Message in current room from another user
        playNotificationSound();
      }
    };

    const handleAvailableRooms = (rooms) => {
      setAvailableRooms(rooms);
    };

    const handleSearchResults = ({ results }) => {
      setSearchResults(results);
      setIsSearching(false);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('available_rooms', handleAvailableRooms);
    socket.on('search_results', handleSearchResults);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('available_rooms', handleAvailableRooms);
      socket.off('search_results', handleSearchResults);
    };
  }, [socket, currentRoom, playNotificationSound, showBrowserNotification]);

  // Handle logout
  const logout = useCallback(() => {
    disconnect();
    setCurrentUser(null);
    setCurrentRoom('general');
    setUnreadCounts({});
    setSearchResults([]);
  }, [disconnect]);

  const value = {
    // State
    currentUser,
    currentRoom,
    availableRooms,
    isConnected,
    messages,
    users,
    typingUsers,
    unreadCounts,
    searchResults,
    isSearching,
    notificationPermission,
    
    // Actions
    login,
    logout,
    changeRoom,
    handleSendMessage,
    handleSendPrivateMessage,
    handleTyping,
    markMessageAsRead,
    addReaction,
    removeReaction,
    searchMessages,
    loadMoreMessages,
    playNotificationSound,
    showBrowserNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

