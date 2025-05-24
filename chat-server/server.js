// Simple Node.js/Express/Socket.IO server with JWT authentication and chat storage
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const SECRET = 'supersecretkey';
const USERS_FILE = path.join(__dirname, 'users.json');
const CHATS_FILE = path.join(__dirname, 'chats.json');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

// Helper: Load/Save users
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
// Helper: Load/Save chats
function loadChats() {
  if (!fs.existsSync(CHATS_FILE)) return {};
  return JSON.parse(fs.readFileSync(CHATS_FILE));
}
function saveChats(chats) {
  fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
}

// Signup endpoint
app.post('/signup', (req, res) => {
  const { username, email, password, tel } = req.body;
  if (!username || !email || !password || !tel) return res.status(400).json({ error: 'All fields required' });
  let users = loadUsers();
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const hash = bcrypt.hashSync(password, 8);
  const user = { id: Date.now().toString(), username, email, password: hash, tel };
  users.push(user);
  saveUsers(users);
  const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, username, email, tel } });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  let users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, tel: user.tel } });
});

// Middleware to verify JWT
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
}

// Socket.IO for real-time chat
io.use(authenticateSocket);
io.on('connection', (socket) => {
  const userId = socket.user.id;
  socket.join(userId);
  // Send chat history
  const chats = loadChats();
  socket.emit('chat_history', chats[userId] || []);

  // Receive message from user
  socket.on('user_message', (msg) => {
    const chats = loadChats();
    if (!chats[userId]) chats[userId] = [];
    const message = { sender: 'user', message: msg, timestamp: new Date().toISOString() };
    chats[userId].push(message);
    saveChats(chats);
    // Notify admin (broadcast to admin room)
    io.to('admin').emit('new_message', { userId, ...message });
  });

  // Receive message from admin
  socket.on('admin_message', ({ toUserId, msg }) => {
    const chats = loadChats();
    if (!chats[toUserId]) chats[toUserId] = [];
    const message = { sender: 'admin', message: msg, timestamp: new Date().toISOString() };
    chats[toUserId].push(message);
    saveChats(chats);
    // Send to user if online
    io.to(toUserId).emit('new_message', message);
  });

  // If admin, join admin room
  if (socket.user.email === 'admin@admin.com') {
    socket.join('admin');
  }
});

server.listen(3001, () => console.log('Server running on http://localhost:3001'));
