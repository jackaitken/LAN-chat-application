const config = require('./lib/config');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const flash = require('express-flash');
const session = require('express-session');
const store = require('connect-loki');
const morgan = require('morgan');
const io = new Server(server);
const bodyParser = require('body-parser');
const chatMessages = {};

const PgPersistence = require('./lib/pg-persistence');

const PORT = config.PORT;
const LokiStore = store(session);

app.set('view engine', 'ejs');
app.use(morgan('common'));
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in millseconds
    path: "/",
    secure: false,
  },
  name: "chat-application-portfolio-project",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

app.use(flash());

// Create a new datastore
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next()
});

app.use((req, res, next) => {
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  next();
});

function requiresAuth(req, res, next) {
  if (!res.locals.signedIn) {
    console.log('Unauthorized');
    req.flash('warning', 'Please sign in or create an account');
    res.redirect(302, '/signin');
  } else {
    next();
  }
}

app.get('/', requiresAuth,
  (req, res) => {
    res.render('pages/index', {
      flash: req.flash(),
      signedIn: res.locals.signedIn,
    });
});

app.get('/signin', (req, res) => {
  res.render('pages/signin', {
    flash: req.flash(),
  });
});

app.post('/signin', async(req, res, next) => {
  try {
    let username = req.body.username.trim();
    let password = req.body.password;
  
    let authenticated = await res.locals.store.verifyCredentials(username, password);
    if (authenticated) {
      req.session.username = username;
      req.session.signedIn = true;
      req.flash('success', 'Welcome back! Set your display name below');
      res.redirect('/');
    } else {
      req.flash('warning', 'Username or password is incorrect');
      res.redirect('signin')
    }
  } catch(error) {
    next(error);
  }
});

app.get('/newuser', (req, res) => {
  res.render('pages/newuser', {
    flash: req.flash(),
  });
});

app.post('/newuser', async(req, res, next) => {
  try {
    let username = req.body.username.trim();
    let password = req.body.password;
  
    let createUser = await res.locals.store.createNewUser(username, password);
  
    if (createUser) {
      req.session.username = username;
      req.session.signedIn = true;
      req.flash('success', 'Account created. Welcome! Set your display name below');
      res.redirect('/');
    } else {
      req.flash('warning', 'This username already exists. Please try again');
      res.redirect('/newuser');
    }
  } catch (error) {
    next(error);
  }
});

app.post('/signout', (req, res) => {
  delete req.session.username;
  req.session.signedIn = false;
  req.flash('success', 'Successfully signed out');
  res.redirect('/signin');
});

app.get('/getUsername', (req, res) => {
  res.json(res.locals.username);
});

app.post('/newMessage', async(req, res, next) => {
  try {
    debugger;
    let username = req.body.username;
    let message = req.body.message;
    let addMessage = await res.locals.store.addMessage(username, message);
  } catch (error) {
    next(error);
  }
});

// Handle socket connections
io.on('connection', socket => {
  
  // Incoming message
  socket.on('incoming message', data => {
    if (chatMessages[socket.id]) {
      chatMessages[socket.id].push(data.message)
    } else {
      chatMessages[socket.id] = [data.message];
    }
    console.log(chatMessages);
    io.emit('incoming message', data);
  });
  
  // Typing event
  socket.on('typing', displayName => {
    io.emit('typing', displayName);
  });
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(404).render('/pages/404');
});

server.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`);
});