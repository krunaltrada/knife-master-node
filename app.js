const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Support cross origin request
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'x-access-token,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  if (req.method == 'OPTIONS') {
    res.status(200).json();
  } else {
    next()
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

const io = require('socket.io')();
app.io = io;

require('events').EventEmitter.defaultMaxListeners = Infinity;

let Room = require('./socketAPI/room.js');
let roomObjectList = [];
let _ = require('lodash');

app.roomObjectList = roomObjectList;

io.on('connection', (socket) => {
  console.log("New Connection :", socket.id);

  socket.emit('userConnect', JSON.stringify({ socketId: socket.id }));

  // Create Room
  socket.on("newGame", (_playerData) => {
    let { playerName, playerHealth, playerDamage } = JSON.parse(_playerData);
    if (!playerName) { playerName = 'Guest' + Math.floor(Math.random() * 999999); }

    let getRoom = _.find(roomObjectList, _room => !_room.getRoomFull() && !_room.getGameStart());
    if (getRoom) {
      console.log('------- find room -------');
      console.log('RoomId :', getRoom.getRoomId());
      socket.join(getRoom.getRoomId());
      getRoom.connectPlayer(socket, playerName, playerHealth, playerDamage);
    } else {
      console.log('------- new room -------');
      let roomId = Date.now().toString().slice(-10);
      let socketId = socket.id;
      socket.join(roomId);
      let newRoom = new Room(io);
      newRoom.setRoomId(roomId);
      newRoom.setRoomCreatorSocketId(socketId);
      newRoom.connectPlayer(socket, playerName, playerHealth, playerDamage);
      roomObjectList.push(newRoom);
      console.log('RoomId :', roomId);
      console.log("Total Rooms :", roomObjectList.length);
    }
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
