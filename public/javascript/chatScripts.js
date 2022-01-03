document.addEventListener('DOMContentLoaded', () => {
  loadMessages();
  let socket = io();
  
  let form = document.getElementById('compose-message-form');
  let input = document.getElementById('message-input');
  let messagesList = document.getElementById('message-list');
  let typingBox = document.getElementById('typing-notification');

  input.focus();

  // Send message
  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    let data = {};
    let response = await fetch('/getUserDetails', { method: 'GET' });
    let { username, displayName } = await response.json();

    if (input.value) {
      data.message = input.value;
      data.display_name = displayName;
      data.username = username;
      socket.emit('incoming message', data);
      input.value = '';
      typingBox.innerText = '';
    }

    await fetch('/newMessage', {
      method: 'POST',
      body: JSON.stringify({
        message: data.message,
      }),
      headers: { 'Content-Type': 'application/json' }
    });
  });

  socket.on('incoming message', async(data) => {
    typingBox.innerText = '';
    messagesList.scrollTop = messagesList.scrollHeight;
    let username = await getUsername();
    await addMessageToList(data, username);
  });

  socket.on('signin', username => {
    let signInBox = document.getElementById('notification');
    signInBox.style.animationPlayState = 'running';
    signInBox.innerText = `${username} just signed in!`;
  });

  socket.on('new account', username => {
    let newUserBox = document.getElementById('notification');
    newUserBox.style.animationPlayState = 'running';
    newUserBox.innerText = `${username} just created an account!`;
  });

  async function loadMessages() {
    let messagesResponse = await fetch('/getMessages', { method: 'GET' });
    let messages = await messagesResponse.json();

    let username = await getUsername();

    for await (let message of messages) {
      await addMessageToList(message, username);
    }
  }

  async function addMessageToList(data, username) {
    let item = document.createElement('div');
    item.textContent = `${data.display_name}: ${data.message}`;
    debugger;
    if (data.username === username) {
      item.id = 'new-message-user';
    } else {
      item.id = 'new-message';
    }
    messagesList.prepend(item);
  }

  async function getUsername() {
    let usernameResponse = await fetch('/getUsername', { method: 'GET' });
    let username = await usernameResponse.json();
    return username;
  }
});
