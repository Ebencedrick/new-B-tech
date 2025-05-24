// Handles user authentication and real-time chat via Socket.IO
let socket = null;
let currentUser = null;
let jwtToken = localStorage.getItem('jwtToken') || null;

function showChatUI(show) {
  const chatSection = document.getElementById('user-chat-section');
  if (chatSection) chatSection.style.display = show ? 'block' : 'none';
}

function showProfilePopup(show) {
  document.getElementById('profilePopup').style.display = show ? 'block' : 'none';
}
function showLoginPopup(show) {
  document.getElementById('loginPopup').style.display = show ? 'block' : 'none';
}

function handleAuth() {
  if (jwtToken) {
    // Try to connect socket
    socket = io('http://localhost:3001', { auth: { token: jwtToken } });
    socket.on('connect', () => {
      showChatUI(true);
      showProfilePopup(false);
      showLoginPopup(false);
    });
    socket.on('chat_history', msgs => renderChatBox(msgs));
    socket.on('new_message', msg => appendChatMessage(msg));
    socket.on('disconnect', () => showChatUI(false));
  } else {
    showChatUI(false);
  }
}

// Sign up
function setupSignup() {
  const form = document.querySelector('#profilePopup form');
  form.onsubmit = async function(e) {
    e.preventDefault();
    const [name, email, tel, password] = Array.from(form.querySelectorAll('input')).map(i => i.value);
    const res = await fetch('http://localhost:3001/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name, email, password, tel })
    });
    const data = await res.json();
    if (data.token) {
      jwtToken = data.token;
      localStorage.setItem('jwtToken', jwtToken);
      currentUser = data.user;
      handleAuth();
    } else {
      alert(data.error || 'Sign up failed');
    }
  };
}
// Login
function setupLogin() {
  const form = document.querySelector('#loginPopup form');
  form.onsubmit = async function(e) {
    e.preventDefault();
    const [email, password] = Array.from(form.querySelectorAll('input')).map(i => i.value);
    const res = await fetch('http://localhost:3001/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
      jwtToken = data.token;
      localStorage.setItem('jwtToken', jwtToken);
      currentUser = data.user;
      handleAuth();
    } else {
      alert(data.error || 'Login failed');
    }
  };
}

// Chat UI logic
function setupChat() {
  const form = document.getElementById('user-chat-form');
  form.onsubmit = function(e) {
    e.preventDefault();
    const input = document.getElementById('user-chat-input');
    if (input.value.trim() && socket) {
      socket.emit('user_message', input.value.trim());
      input.value = '';
    }
  };
}
function renderChatBox(msgs) {
  const chatBox = document.getElementById('user-chat-box');
  chatBox.innerHTML = '';
  msgs.forEach(msg => appendChatMessage(msg));
}
function appendChatMessage(msg) {
  const chatBox = document.getElementById('user-chat-box');
  const div = document.createElement('div');
  div.style.textAlign = msg.sender === 'user' ? 'right' : 'left';
  div.innerHTML = `<span style='background:${msg.sender==='user'?'#007bff':'#eee'};color:${msg.sender==='user'?'#fff':'#333'};padding:0.3rem 0.7rem;border-radius:12px;display:inline-block;'>${msg.message}</span><br><span style='font-size:0.8em;color:#888;'>${msg.timestamp}</span>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// UI event bindings
window.addEventListener('DOMContentLoaded', function() {
  setupSignup();
  setupLogin();
  setupChat();
  document.querySelector('.profile-button').onclick = () => showProfilePopup(true);
  document.getElementById('cancelSignUp').onclick = () => showProfilePopup(false);
  document.getElementById('loginButton').onclick = () => { showProfilePopup(false); showLoginPopup(true); };
  document.getElementById('cancelLogin').onclick = () => showLoginPopup(false);
  handleAuth();
});
