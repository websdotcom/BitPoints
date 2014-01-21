/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var app = express();
var server = http.createServer(app);
var io = require("socket.io").listen(server);


// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes.
app.get('/', routes.index);
app.get('/create', routes.create);
app.get(/^\/roomHost\/([0-9]+)\/([a-zA-Z0-9]*)/, routes.roomHost);
app.get('/roomJoin/:id', routes.roomJoin);

// Listen on the port.
server.listen(app.get("port"));

// Socket stuff.
io.sockets.on('connection', function (socket) {
	var inRoom = "";

  socket.on('createRoom', function (data) {
    console.log("Room", data.roomId, "created.");
    socket.join(data.roomId);
    inRoom = data.roomId;
  });

  socket.on('joinRoom', function (data) {
    console.log("Someone joined", data.roomId);
    socket.join(data.roomId);
    inRoom = data.roomId;
  });

  socket.on('sendVote', function(data) {
  	io.sockets.in(inRoom).emit("incomingVote", data);
  });

});