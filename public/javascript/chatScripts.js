document.addEventListener('DOMContentLoaded', () => {
  let socket = io();
  
  let form = document.getElementById('compose-message-form');
  let input = document.getElementById('message-input');
  let messages = document.getElementById('message-list');
  let typingBox = document.getElementById('typing-notification');
  let displayNameForm = document.getElementById('set-display-name');
  let displayNameInput = document.getElementById('display-name-input');
  let displayName = 'Unknown';
  input.focus();

  // Send message
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value) {
      socket.emit('incoming message', {
        displayName: displayName,
        message: input.value,
      });
      input.value = '';
      typingBox.innerText = ''
    }
  });

  displayNameForm.addEventListener('submit', event => {
    event.preventDefault();
    if (displayNameInput.value) {
      displayName = displayNameInput.value;
      displayNameInput.setAttribute('aria-invalid', 'false');
    }
  });

  form.addEventListener('keypress', () => {
    socket.emit('typing', userdisplayName);
  });
  
  // Receive any messages
  socket.on('incoming message', data => {
    messages.scrollTop = messages.scrollHeight;
    let item = document.createElement('div');
    item.textContent = `${data.displayName}:  ${data.message}`;
    item.id = 'new-message';
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
