document.addEventListener('DOMContentLoaded', () => {
  let socket = io();

  let newAccountForm = document.getElementById('modal-form');
  let username = document.getElementById('username');

  newAccountForm.addEventListener('submit', () => {
    if (username.value) {
      socket.emit('new account', username.value);
    }
  });
});