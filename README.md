# Chat Application

If you would like to see a live version of this application [please visit this website](http://safe-fjord-73332.herokuapp.com/).

To get started just create a new account, set up your display name and starting chatting.

### A Bit of Explanation

This is a chat application that I developed using mainly:
- Node.js
- Express
- PostgreSQL, and
- Socket.io

The application allows multiple users to send messages back and forth with eachother. 

Socket.io handles the heavy lifting of allowing the communication, while PostgreSQL stores user and message data. "Socket.IO is a library that enables real-time, bidirectional and event-based communication between the browser and the server."

What this means is that we can establish a channel of communication between the server and the client by instaniating two sockets. One on the the client side of our code, and one the server side. When a user sends a message, this event is emitted to the server and the server handles emitting that message to all socket connections.

The two main transportation methods employed by Socket.io are:
- Websockets, and
- HTTP long-polling

with the preference being the former and using the latter as a fallback if WebSockets are not supported.

You are more than welcome to fork this repo and customize it however you would like.

If you notice a bug, or have a feature that you think might be interesting please add an issue. Please also note that this is a portfolio project.