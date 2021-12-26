document.addEventListener('DOMContentLoaded', () => {
  let socket = io();

  let signinForm = document.getElementById('modal-form');
  let username = document.getElementById('username');

  signinForm.addEventListener('submit', () => {
    if (username.value) {
      socket.emit('signin', username.value);
    }
  });
});