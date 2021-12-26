document.addEventListener('DOMContentLoaded', () => {
  let socket = io();
  loadMessages();
  
  let form = document.getElementById('compose-message-form');
  let input = document.getElementById('message-input');
  let messagesList = document.getElementById('message-list');
  let typingBox = document.getElementById('typing-notification');

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

  form.addEventListener('keypress', async() => {
    let response = await fetch('/getUsername', { method: 'GET' });
    let username = await response.json();
    socket.emit('typing', username);
  });
  
  // Receive any messages
  socket.on('incoming message', data => {
    typingBox.innerText = '';
    messagesList.scrollTop = messagesList.scrollHeight;
    addMessageToList(data);
  });

  socket.on('typing', async(typingUsername) => {
    let response = await fetch('/getUsername', { method: 'GET' });
    let username = await response.json();
    if (username !== typingUsername) {
      typingBox.innerText = `${typingUsername} is typing...`;
    }
  });

  socket.on('signin', username => {
    let signInBox = document.getElementById('sign-in-notification');
    signInBox.style.animationPlayState = 'running';
    signInBox.innerText = `${username} just signed in!`;
  });

  async function loadMessages() {
    let response = await fetch('/getMessages', { method: 'GET' });
    let messages = await response.json();

    messages.forEach(data => {
      addMessageToList(data);
    });
  }

  function addMessageToList(data) {
    let item = document.createElement('div');
    item.textContent = `${data.username}: ${data.message}`
    item.id = 'new-message';
    messagesList.prepend(item);
  }
});
