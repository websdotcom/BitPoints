var express = require('express');
var http = require('http');
var path = require('path');
var _ = require('lodash');
var routes = require('./routes');
var config = require('./config.js').config;
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server, {log: false});
var lessCompiler = require('express-less-middleware')();
var logger = require('./logger');

var rooms = {};
var userCount = 0;

var loggableEvents = [
	'newVote','newRound','roundEnd','kickVoter','updateVoters'
];

var logEvent = function(event, data) {
	logger.info({
		event: event,
		data: data
	}, 'socket event');
};

/**
 * Method for passing events between host and clients
 * Use this method only when incoming event name matches
 * outgoing event name and no data massaging is necessary
 */
var setupRoomEvents = function(socket,room,events) {
	var emitFn = function(eventName) {
		return function(data) {
			if (_.includes(loggableEvents, eventName)) {
				logEvent(eventName, data);
			}
			io.sockets.in(room).emit(eventName, data);
		};
	};

	for(var i = 0; i < events.length; i++) {
		socket.on(events[i], emitFn(events[i]));
	}
};

var setupPassThroughEvents = function(socket, room) {
	setupRoomEvents(socket,room,[
		'newVote','newRound','roundEnd','deckChange','kickVoter','updateVoters'
	]);
};

var addUser = function() {
	userCount++;
};

var dropUser = function() {
	if (userCount > 0) {
		userCount--;
	}
};

var dropRoom = function(roomId) {
	delete rooms[roomId];
};

var getRoomCount = function() {
	return _.keys(rooms).length;
};

var getUserCount = function() {
	return userCount;
};

// Attach properties to app for use elsewhere
app.config = config;
app.utils = {
	setupRoomEvents: setupRoomEvents,
	getRoomCount: getRoomCount,
	getUserCount: getUserCount
};

// Configure the app for all environments.
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(require('express-favicon')(path.join(__dirname, 'public/images/favicon.png')));
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({extended: false}));
app.use(require('cookie-parser')());
app.use(require('serve-static')(path.join(__dirname, 'public')));
app.use(lessCompiler);

// Configure socket.io.
app.locals.io = io;
app.locals.rooms = rooms;

// Debugging for dev environments.
if (config.debug) {
	app.use(require('morgan')('dev'));
	app.use(require('errorhandler')());
}

// Routes.
app.get('/', routes.index);
app.get('/create', routes.create);
app.get(/^\/host\/([0-9]+)\/([-%a-zA-Z0-9]*)/, routes.host);
app.get('/join/:id', routes.join);
app.get('/kick', routes.kick);
app.get(/^\/([0-9a-z]{1,5})$/, routes.invite);

// Listen on the port.
server.listen(app.get('port'), function() {
	logger.info('BitPoints is ready to go at http://localhost:' + config.port);
});

// Socket stuff.
io.sockets.on('connection', function (socket) {
	var inRoom = '';
	var host = false;
	var myName;
	var uid;
	var hostRoomId;

	socket.on('createRoom', function (data) {
		logEvent('createRoom', data);

		rooms[data.roomId] = data;
		socket.join(data.roomId);
		host = true;
		hostRoomId = data.roomId;

		// if there are any voters in the room that's just been created, prompt them to join
		io.sockets.in(data.roomId).emit('roomRefresh', {});

		// set up host <-> client events that just pass through app
		setupPassThroughEvents(socket, data.roomId);
	});

	socket.on('joinRoom', function (data) {
		logEvent('joinRoom', data);

		// Set client socket metadata.
		myName = data.name;
		inRoom = data.roomId;
		uid = myName + new Date().getTime();
		data.uid = uid;
		addUser();

		// Join the room.
		socket.join(data.roomId);
		io.sockets.in(inRoom).emit('newVoter', data);

		// Send the user their uid.
		socket.emit('uidAssignment', {uid: uid});

		// set up host <-> client events that just pass through app
		setupPassThroughEvents(socket, data.roomId);
	});

	socket.on('disconnect', function() {
		if (!host) {
			dropUser();
			io.sockets.in(inRoom).emit('voterLeave', {uid: uid});
		} else {
			dropRoom(hostRoomId);
		}
	});

});

// Handle 404 errors
app.use(function(req, res){
	res.status(404);

	// Respond with html page
	if (req.accepts('html')) {
		res.render('httpError', {
			status: 404,
			url: req.url,
			bodyClass: 'one-column'
		});
		return;
	}

	// Respond with json
	if (req.accepts('json')) {
		res.send({ error: 'Not found' });
		return;
	}

	// Default to plain-text. send()
	res.type('txt').send('Not found');
});

