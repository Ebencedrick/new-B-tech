// Simple backend simulation for chat (for demo only)
// In production, use a real backend (Node.js, Firebase, etc.)

let messages = [
  // Example: {from: 'user', name: 'John', email: 'john@example.com', text: 'Hello, admin!', time: '2025-05-21 10:00'}
];

// Simulate sending a message from user
window.sendUserMessage = function(name, email, text) {
  messages.push({from: 'user', name, email, text, time: new Date().toLocaleString()});
  window.dispatchEvent(new Event('messagesUpdated'));
};

// Simulate sending a message from admin
window.sendAdminReply = function(text) {
  messages.push({from: 'admin', name: 'Admin', email: 'admin@example.com', text, time: new Date().toLocaleString()});
  window.dispatchEvent(new Event('messagesUpdated'));
};

// Get all messages
window.getAllMessages = function() {
  return messages;
};

// Listen for updates: window.addEventListener('messagesUpdated', ...)
