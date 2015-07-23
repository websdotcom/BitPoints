
var express = require('express');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var fs = require('fs');
var _ = require('lodash');
var routes = require('./routes');
var config = require('./config.js').config;
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var models = {};
var modelsDir = __dirname + '/models';

/**
 * Method for passing events between host and clients
 * Use this method only when incoming event name matches
 * outgoing event name and no data massaging is necessary
 */
var setupRoomEvents = function(socket,room,events) {
	var emitFn = function(eventName) {
			return function(data) {
				io.sockets.in(room).emit(eventName, data);
			};
		};

	for(var i = 0; i < events.length; i++) {
		socket.on(events[i], emitFn(events[i]));
	}
};

/**
 * Get a list of rooms with activity within a specific timespan
 */
var getActiveRooms = function(daysBack,callback) {
	var limit = new Date();
	limit.setDate(limit.getDate()-daysBack);
	models.Room.find({'lastActivity':{$gte:limit.toISOString()}},callback);
};

// Convenience methods for returning rooms active in the past X days
var getRoomsPastDay = _.curry(getActiveRooms)(1);
var getRoomsPastWeek = _.curry(getActiveRooms)(7);


// Attach properties to app for use elsewhere
app.config = config;
app.locals.models = models;
app.utils = {
	setupRoomEvents: setupRoomEvents,
	getActiveRooms: getActiveRooms,
	getRoomsPastDay: getRoomsPastDay,
	getRoomsPastWeek: getRoomsPastWeek
};


fs.readdirSync(modelsDir).forEach(function(file) {
	if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
		_.merge(models, require(modelsDir + '/' + file));
	}
});

// Configure the app for all environments.
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon(path.join(__dirname, 'public/images/favicon.png')));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(app.router);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
mongoose.connect('mongodb://'+config.mongoHost+'/BitPoints');

// Configure socket.io.
io.set('log level', config.ioLogLevel);
app.locals.io = io;

// Debugging for dev environments.
if (config.debug) {
	app.use(express.logger('dev'));
	app.use(express.errorHandler());
}

// Routes.
app.get('/', routes.index);
app.get('/create', routes.create);
app.get(/^\/host\/([0-9]+)\/([-%a-zA-Z0-9]*)/, routes.host);
app.get('/join/:id', routes.join);
app.get('/kick', routes.kick);
app.get(/^\/([0-9a-z]{1,5})$/, routes.invite);
app.get('/addTicketCookie', routes.ticketing.addTicketCookie);

// Listen on the port.
server.listen(app.get('port'));

// Socket stuff.
io.sockets.on('connection', function (socket) {
	var inRoom = '',
		host = false,
		myName,
		uid;

	socket.on('createRoom', function (data) {
		var room = new models.Room();

		console.log('Room', data.roomId, 'created.');
		socket.join(data.roomId);
		room.roomId = data.roomId;
		room.title = data.title;
		host = true;

		// if there are any voters in the room that's just been created, prompt them to join
		io.sockets.in(data.roomId).emit('roomRefresh', {});

		room.save(function(err, room){
			if(err){ console.error('Failed to persist new room!'); return; }
		});
	});

	socket.on('joinRoom', function (data) {

		// Set client socket metadata.
		myName = data.name;
		inRoom = data.roomId;
		uid = myName + new Date().getTime();
		data.uid = uid;

		// Join the room.
		socket.join(data.roomId);
		io.sockets.in(inRoom).emit('newVoter', data);

		// Send the user their uid.
		socket.emit('uidAssignment', {uid: uid});

		// Update mongo with the room join count.
		models.Room.findOne({ roomId: inRoom }, function(err, room){
			if(err || !room){ console.error('Couldn\'t find room '+inRoom); return; }
			room.addUser(data);
			socket.emit('roomName', {name: room.title});
		});
	});

	socket.on('disconnect', function(data) {
		if (!host) {
			io.sockets.in(inRoom).emit('voterLeave', {uid: uid});
		}
	});

	// set up host <-> client events that just pass through app
	setupRoomEvents(socket,inRoom,[
		'newVote','newRound','roundEnd','deckChange','kickVoter'
	]);

});

// Handle 404 errors
app.use(function(req, res, next){
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

console.log('BitPoints is ready to go at http://localhost:' + config.port);
