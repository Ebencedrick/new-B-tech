// Simple backend simulation for chat (for demo only)
// In production, use a real backend (Node.js, Firebase, etc.)

// Simulated persistent chat data (in-memory JSON-like structure)
let chatData = {
  // userId: [ { sender: 'user'|'admin', message: '', timestamp: '' } ]
};

// Helper to get userId (use email as unique id)
function getUserId(name, email) {
  return (email || '').toLowerCase();
}

// Load chat history for a user
window.loadChatHistory = function(userId) {
  return chatData[userId] ? [...chatData[userId]] : [];
};

// Send message from user
window.sendUserMessage = function(name, email, text) {
  const userId = getUserId(name, email);
  if (!chatData[userId]) chatData[userId] = [];
  chatData[userId].push({ sender: 'user', message: text, timestamp: new Date().toLocaleString() });
  window.dispatchEvent(new CustomEvent('messagesUpdated', { detail: { userId } }));
};

// Send message from admin
window.sendAdminReply = function(userId, text) {
  if (!chatData[userId]) chatData[userId] = [];
  chatData[userId].push({ sender: 'admin', message: text, timestamp: new Date().toLocaleString() });
  window.dispatchEvent(new CustomEvent('messagesUpdated', { detail: { userId } }));
};

// Get all users
window.getAllChatUsers = function() {
  return Object.keys(chatData);
};

// Get all messages for a user
window.getChatMessages = function(userId) {
  return chatData[userId] ? [...chatData[userId]] : [];
};

// Optionally: Load initial chat data from localStorage (simulate disk)
if (localStorage.getItem('chatData')) {
  try {
    chatData = JSON.parse(localStorage.getItem('chatData'));
  } catch (e) { chatData = {}; }
}

// Save chat data to localStorage on every update
window.addEventListener('messagesUpdated', function() {
  localStorage.setItem('chatData', JSON.stringify(chatData));
});
