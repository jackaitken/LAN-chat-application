document.addEventListener('DOMContentLoaded', () => {
  let socket = io();
  
  let form = document.getElementById('form');
  let input = document.getElementById('message-input');
  let messages = document.getElementById('message-list');
  let typingBox = document.getElementById('typing-notification');
  input.style.display = 'none';
  form.style.display = 'none';
  messages.style.display = 'none';

  let displayNameForm = document.getElementById('modal-form');
  let displayNameInput = document.getElementById('display-name-input');
  displayNameInput.focus();
  let userdisplayName;

  // Listen for display name save
  displayNameForm.addEventListener('submit', event => {
    event.preventDefault();
    if (displayNameInput.value) {
      userdisplayName = displayNameInput.value;
      document.getElementById('modal-content').style.display = 'none';
      input.style.display = 'block';
      form.style.display = 'block';
      messages.style.display = 'block';
      input.focus();
    }
  });
  
  // Send message
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value) {
      socket.emit('incoming message', {
        displayName: userdisplayName,
        message: input.value,
      });
      input.value = '';
      typingBox.innerText = ''
    }
  });

  form.addEventListener('keypress', () => {
    socket.emit('typing', userdisplayName);
  });
  
  // Receive any messages
  socket.on('incoming message', data => {
    messages.style.display = 'block';
    messages.scrollTop = messages.scrollHeight;
    let item = document.createElement('div');
    if (data.displayName !== userdisplayName) {
      item.style.color = 'gray';
    }
    item.textContent = `${data.displayName}:  ${data.message}`;
    item.className = 'new-message';
    messages.appendChild(item);
    typingBox.innerText = '';
  });

  socket.on('typing', displayName => {
    if (userdisplayName !== displayName) {
      typingBox = document.getElementById('typing-notification');
      typingBox.innerText = `${displayName} is typing...`;
    }
  });
});
