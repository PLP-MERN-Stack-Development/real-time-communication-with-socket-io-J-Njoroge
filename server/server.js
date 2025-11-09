// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Store connected users, messages, and rooms
const users = {}; // { socketId: { username, id, currentRoom } }
const messages = {}; // { roomId: [messages] }
const typingUsers = {}; // { roomId: { socketId: username } }
const rooms = new Set(['general', 'random', 'tech', 'gaming']); // Default rooms
const messageReactions = {}; // { messageId: { reaction: [userIds] } }
const readReceipts = {}; // { messageId: { userId: timestamp } }

// Initialize default room messages
rooms.forEach(room => {
  messages[room] = [];
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', ({ username, room = 'general' }) => {
    if (!username || username.trim() === '') {
      socket.emit('error', { message: 'Username is required' });
      return;
    }

    // Join default room
    socket.join(room);
    users[socket.id] = { 
      username: username.trim(), 
      id: socket.id,
      currentRoom: room,
      joinedAt: new Date().toISOString()
    };

    // Send existing messages for the room
    socket.emit('room_messages', messages[room] || []);
    
    // Notify others in the room
    socket.to(room).emit('user_joined', { 
      username: users[socket.id].username, 
      id: socket.id,
      room 
    });

    // Send updated user list for the room
    const roomUsers = Object.values(users).filter(u => u.currentRoom === room);
    io.to(room).emit('user_list', roomUsers);
    
    // Send all available rooms
    socket.emit('available_rooms', Array.from(rooms));
    
    console.log(`${username} joined room: ${room}`);
  });

  // Handle room change
  socket.on('join_room', ({ room }) => {
    if (!users[socket.id]) return;

    const user = users[socket.id];
    const oldRoom = user.currentRoom;

    // Leave old room
    socket.leave(oldRoom);
    socket.to(oldRoom).emit('user_left', { 
      username: user.username, 
      id: socket.id,
      room: oldRoom 
    });

    // Join new room
    if (!rooms.has(room)) {
      rooms.add(room);
    }
    if (!messages[room]) {
      messages[room] = [];
    }

    socket.join(room);
    user.currentRoom = room;

    // Send existing messages for the new room
    socket.emit('room_messages', messages[room] || []);

    // Notify others in the new room
    socket.to(room).emit('user_joined', { 
      username: user.username, 
      id: socket.id,
      room 
    });

    // Update user lists
    const oldRoomUsers = Object.values(users).filter(u => u.currentRoom === oldRoom);
    io.to(oldRoom).emit('user_list', oldRoomUsers);

    const newRoomUsers = Object.values(users).filter(u => u.currentRoom === room);
    io.to(room).emit('user_list', newRoomUsers);

    // Send all available rooms
    io.emit('available_rooms', Array.from(rooms));
    
    console.log(`${user.username} moved from ${oldRoom} to ${room}`);
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    if (!users[socket.id]) return;

    const user = users[socket.id];
    const room = user.currentRoom || 'general';

    const message = {
      ...messageData,
      id: uuidv4(),
      sender: user.username,
      senderId: socket.id,
      room,
      timestamp: new Date().toISOString(),
      readBy: {},
      reactions: {},
    };

    if (!messages[room]) {
      messages[room] = [];
    }
    
    messages[room].push(message);
    
    // Limit stored messages per room
    if (messages[room].length > 500) {
      messages[room].shift();
    }

    // Mark as read by sender
    message.readBy[socket.id] = new Date().toISOString();
    
    // Emit to all users in the room
    io.to(room).emit('receive_message', message);

    // Send acknowledgment to sender
    socket.emit('message_sent', { messageId: message.id });
  });

  // Handle typing indicator
  socket.on('typing', ({ isTyping, room }) => {
    if (!users[socket.id]) return;

    const user = users[socket.id];
    const currentRoom = room || user.currentRoom || 'general';

    if (!typingUsers[currentRoom]) {
      typingUsers[currentRoom] = {};
    }

    if (isTyping) {
      typingUsers[currentRoom][socket.id] = user.username;
    } else {
      delete typingUsers[currentRoom][socket.id];
    }

    socket.to(currentRoom).emit('typing_users', Object.values(typingUsers[currentRoom] || {}));
  });

  // Handle private messages
  socket.on('private_message', ({ to, message }) => {
    if (!users[socket.id] || !users[to]) return;

    const sender = users[socket.id];
    const receiver = users[to];

    const messageData = {
      id: uuidv4(),
      sender: sender.username,
      senderId: socket.id,
      receiverId: to,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
      readBy: {},
      reactions: {},
    };

    // Send to receiver
    socket.to(to).emit('private_message', messageData);
    // Send to sender
    socket.emit('private_message', messageData);
  });

  // Handle read receipts
  socket.on('mark_read', ({ messageId, room }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    const roomMessages = messages[currentRoom] || [];
    const message = roomMessages.find(m => m.id === messageId);

    if (message) {
      if (!message.readBy) {
        message.readBy = {};
      }
      message.readBy[socket.id] = new Date().toISOString();
      
      // Notify sender that message was read
      io.to(message.senderId).emit('message_read', { 
        messageId, 
        readBy: users[socket.id].username 
      });
    }
  });

  // Handle message reactions
  socket.on('add_reaction', ({ messageId, reaction, room }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    const roomMessages = messages[currentRoom] || [];
    const message = roomMessages.find(m => m.id === messageId);

    if (message) {
      if (!message.reactions) {
        message.reactions = {};
      }
      if (!message.reactions[reaction]) {
        message.reactions[reaction] = [];
      }
      
      // Add user if not already reacted
      if (!message.reactions[reaction].includes(socket.id)) {
        message.reactions[reaction].push(socket.id);
      }

      // Broadcast updated reactions
      io.to(currentRoom).emit('reaction_added', { 
        messageId, 
        reaction, 
        reactions: message.reactions 
      });
    }
  });

  // Handle removing reaction
  socket.on('remove_reaction', ({ messageId, reaction, room }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    const roomMessages = messages[currentRoom] || [];
    const message = roomMessages.find(m => m.id === messageId);

    if (message && message.reactions && message.reactions[reaction]) {
      message.reactions[reaction] = message.reactions[reaction].filter(
        id => id !== socket.id
      );

      // Broadcast updated reactions
      io.to(currentRoom).emit('reaction_added', { 
        messageId, 
        reaction, 
        reactions: message.reactions 
      });
    }
  });

  // Handle message search request
  socket.on('search_messages', ({ query, room }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    const roomMessages = messages[currentRoom] || [];
    
    const results = roomMessages.filter(msg => 
      msg.message && msg.message.toLowerCase().includes(query.toLowerCase())
    ).slice(-50); // Return last 50 matches

    socket.emit('search_results', { query, results });
  });

  // Handle pagination request
  socket.on('load_messages', ({ room, page = 0, limit = 50 }) => {
    if (!users[socket.id]) return;

    const currentRoom = room || users[socket.id].currentRoom || 'general';
    const roomMessages = messages[currentRoom] || [];
    
    const start = roomMessages.length - (page + 1) * limit;
    const end = roomMessages.length - page * limit;
    const paginatedMessages = roomMessages.slice(Math.max(0, start), end);

    socket.emit('paginated_messages', { 
      messages: paginatedMessages, 
      page, 
      hasMore: start > 0 
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const user = users[socket.id];
      const room = user.currentRoom || 'general';
      
      socket.to(room).emit('user_left', { 
        username: user.username, 
        id: socket.id,
        room 
      });

      // Clean up typing indicators
      if (typingUsers[room]) {
        delete typingUsers[room][socket.id];
        socket.to(room).emit('typing_users', Object.values(typingUsers[room] || {}));
      }

      delete users[socket.id];

      // Update user list
      const roomUsers = Object.values(users).filter(u => u.currentRoom === room);
      io.to(room).emit('user_list', roomUsers);
      
      console.log(`${user.username} left the chat`);
    }
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// API routes
app.get('/api/messages/:room', (req, res) => {
  const { room } = req.params;
  res.json(messages[room] || []);
});

app.get('/api/messages', (req, res) => {
  res.json(messages);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
