document.addEventListener('DOMContentLoaded', () => {
  let socket = io();

  loadMessages();
  
  let form = document.getElementById('compose-message-form');
  let input = document.getElementById('message-input');
  let messagesList = document.getElementById('message-list');

  input.focus();

  // Send message
  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    let data = {};
    let response = await fetch('/getUsername', { method: 'GET' });
    let username = await response.json();

    if (input.value) {
      data.message = input.value;
      data.username = username;
      socket.emit('incoming message', data);
      input.value = '';
      typingBox.innerText = '';
    }

    // Send message to server
    await fetch('/newMessage', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  });

  form.addEventListener('keypress', () => {
    socket.emit('typing', username);
  });
  
  // Receive any messages
  socket.on('incoming message', data => {
    messagesList.scrollTop = messagesList.scrollHeight;
    let item = document.createElement('div');
    item.textContent = `${data.username}:  ${data.message}`;
    item.id = 'new-message';
    messagesList.appendChild(item);
    typingBox.innerText = '';
  });

  socket.on('typing', typingUsername => {
    if (username !== typingUsername) {
      typingBox = document.getElementById('typing-notification');
      typingBox.innerText = `${typingUsername} is typing...`;
    }
  });

  async function loadMessages() {
    let response = await fetch('/getMessages', { method: 'GET' });
    let messages = await response.json();

    messages.forEach(data => {
      let item = document.createElement('div');
      item.textContent = `${data.username}: ${data.message}`
      item.id = 'new-message';
      messagesList.appendChild(item);
    });
  }
});
