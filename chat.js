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
  res.locals.displayName = req.session.displayName;
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

function requiresDisplayName(req, res, next) {
  if (!res.locals.displayName) {
    console.log('Display name required');
    res.redirect(302, '/changeDisplayName');
  } else {
    next();
  }
};

app.get('/', 
  requiresAuth,
  requiresDisplayName,
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
      let displayName = await res.locals.store.getDisplayName(username);
      req.session.displayName = displayName;
      req.session.username = username;
      req.session.signedIn = true;
      req.flash('success', 'Welcome back!');
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
      req.flash('success', 'Account created. Welcome!');
      res.redirect('/');
    } else {
      req.flash('warning', 'This username already exists. Please try again');
      res.redirect('/newuser');
    }
  } catch (error) {
    next(error);
  }
});

app.get('/changeDisplayName', async(req, res, next) => {
  try {
    let username = req.session.username;
    let displayName = await res.locals.store.getDisplayName(username);
    res.render('pages/changeDisplayName', {
      displayName: displayName,
      signedIn: res.locals.signedIn,
    });
  } catch(error) {
    next(error);
  }
});

app.post('/changeDisplayName', async(req, res, next) => {
  try {
    let username = req.session.username;
    let displayName = req.body.displayName;
    let setDisplayName = await res.locals.store.setDisplayName(displayName, username);
    
    if (setDisplayName) {
      req.session.displayName = displayName;
      req.flash('success', 'Display name changed');
      res.redirect('/');
    } else {
      req.flash('warning', 'Could not change username at this time. Please try again');
      res.redirect('/changeDisplayName');
    }
  } catch(error) {
    next(error);
  } 
});

app.post('/signout', (req, res) => {
  delete req.session.username;
  delete req.session.displayName;
  req.session.signedIn = false;
  req.flash('success', 'Successfully signed out');
  res.redirect('/signin');
});

// AJAX requests from client
app.get('/getMessages', async(req, res) => {
  let username = res.locals.username;
  let messages = await res.locals.store.loadMessages(username);
  res.json(messages);
});

app.get('/getDisplayName', async(req, res, next) => {
  try {
    let username = req.session.username;
    let displayName = await res.locals.store.getDisplayName(username);
    res.json(displayName);
  } catch(error) {
    next(error);
  } 
});

app.get('/getUserDetails', async(req, res, next) => {
  try {
    let username = req.session.username;
    let displayName = await res.locals.store.getDisplayName(username);
    res.json({ username: username, displayName: displayName });
  } catch (error) {
    next(error);
  } 
});

app.get('/getUsername', async(req, res, next) => {
  try {
    let username = req.session.username;
    res.json(username);
  } catch (error) {
    next(error);
  }
});

app.post('/newMessage', async(req, res, next) => {
  try {
    let username = req.session.username;
    let message = req.body.message;
    await res.locals.store.addMessage(username, message);
  } catch (error) {
    next(error);
  }
});

// Handle socket connections
io.on('connection', socket => {
  
  socket.on('incoming message', data => {
    io.emit('incoming message', data);
  });

  socket.on('signin', username => {
    io.emit('signin', username);
  });

  socket.on('new account', username => {
    io.emit('new account', username);
  });
});

app.use((req, res, _next) => {
  console.log('Not found');
  res.status(404).render('pages/404');
});

server.listen(PORT, () => {
  console.log(`Listening at port ${PORT}`);
});