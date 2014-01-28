// Module dependencies
var
	express = require('express'),
	http = require('http'),
	path = require('path'),
	mongoose = require('mongoose'),
	fs = require('fs'),
	_ = require('lodash'),

	app = express(),
	server = http.createServer(app),
	io = require('socket.io').listen(server),

	routes = require('./routes'),
	config = require('./config.js').config;

// Load Mongoose models.
var
	models = {},
	modelsDir = __dirname + '/models';

// Set up utility methods
var
	// method for passing events between host and clients
	setupRoomEvents = function(socket,room,events) {
		var emitFn = function(eventName) {
				return function(data) {
					io.sockets.in(room).emit(eventName, data);
				};
			};

		for(var i = 0; i < events.length; i++) {
			socket.on(events[i], emitFn(events[i]));
		}
	},

	getActiveRooms = function(daysBack,callback) {
		var limit = new Date();
		limit.setDate(limit.getDate()-daysBack);
		models.Room.find({'lastActivity':{$gte:limit.toISOString()}},callback);
	},

	// convenience methods for returning rooms active in the past X days
	getRoomsPastDay = _.curry(getActiveRooms)(1),
	getRoomsPastWeek = _.curry(getActiveRooms)(7);

require('fs').readdirSync(modelsDir).forEach(function(file) {
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
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
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
app.get('/', function(req, res){
	getRoomsPastDay(function (err, rooms){
		var numRooms = err ? 0 : rooms.length,
			numVoters = err ? 0 :_.reduce(_.pluck(rooms,'members'), function(memo, num){ return memo + num; }, 0);
		res.render('index', {
			numRooms: numRooms,
			numVoters: numVoters,
			roomString: numRooms + (numRooms === 1 ? ' room' : ' rooms'),
			voterString: numVoters + (numVoters === 1 ? ' person' : ' people')
		});
	});
});
app.get('/create', routes.create);
app.get(/^\/roomHost\/([0-9]+)\/([-%a-zA-Z0-9]*)/, routes.roomHost);
app.get('/roomJoin/:id', routes.roomJoin);
app.get('/kick', routes.kick);

app.get('/addTicketCookie', routes.ticketing.addTicketCookie);

// Listen on the port.
server.listen(app.get('port'));

// Socket stuff.
io.sockets.on('connection', function (socket) {
	var inRoom = '';
	var host = false;
	var myName;

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
		myName = data.user;
		console.log(myName+' joined '+data.roomId);
		socket.join(data.roomId);
		inRoom = data.roomId;
		io.sockets.in(inRoom).emit('newVoter', data);
		models.Room.findOne({ roomId: inRoom }, function(err, room){
			if(err || !room){ console.error('Couldn\'t find room '+inRoom); return; }
			room.addUser(data);
		});
	});

	socket.on('disconnect', function(data) {
		if (!host) {
			io.sockets.in(inRoom).emit('voterLeave', {name: myName});
		}
	});

	// set up host <-> client events that just pass through app
	setupRoomEvents(socket,inRoom,[
		'newVote','newRound','roundEnd','deckChange','kickVoter'
	]);

});

console.log('BitPoints is ready to go at http://localhost:' + config.port);
