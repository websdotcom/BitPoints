var _ = require('lodash');
var gravatar = require('gravatar');

/**
 * GET homepage
 */
exports.index = function(req, res){
	var numRooms = req.app.utils.getRoomCount();
	var numVoters = req.app.utils.getUserCount();

	res.render('index', {
		numRooms: numRooms,
		numVoters: numVoters,
		roomString: numRooms + (numRooms === 1 ? ' room' : ' rooms'),
		voterString: numVoters + (numVoters === 1 ? ' person' : ' people')
	});
};

/**
 * GET create room from homepage
 * @param	title	Room name
 */
exports.create = function(req, res) {
	var id = Math.floor(Math.random() * 50000);

	res.redirect('/host/' + id + '/' + req.query.title);
};

/**
 * GET room UI
 * @param	id	BitPoint RoomID
 * @param	title	Room name
 */
exports.host = function(req, res) {
	var id = req.params[0],
		title = req.params[1] ? req.params[1] : 'Room '+id;

	res.cookie('roomID', id, { maxAge: 900000 });
	res.render('host', {
		room: {
			roomId: id,
			title: title
		},
		inviteId: (+id).toString(36),
		appHost: req.app.config.appHost
	});
};

/**
 * GET invite processing
 * @param  id  invite id in url
 */
exports.invite = function(req, res) {
	var id = req.params[0];
	var roomId = parseInt(id, 36);
	var roomTitle = _.get(req, 'app.locals.rooms[roomId].title', 'A BitPoints room');

	var room = {
		roomId: roomId,
		title: roomTitle
	};
	req.params.id = roomId;
	res.render('invite',{
		room: room,
		bodyClass: 'one-column'
	});
};

/**
 * GET voter UI
 * @param	id	BitPoint RoomID
 * @param	name	Display name of user
 * @param	email	Email address used for Gravatar
 */
exports.join = function(req, res) {
	var colorPad = '000000',
		color = Math.floor(Math.random()*16777215).toString(16),
		paddedColor = colorPad.substring(0,6-color.length)+color;
	res.render('join', {
		room: {
			roomId: req.params.id
		},
		user: {
			name: req.query.name || 'A BitPointer',
			avatar: gravatar.url(req.query.email ? req.query.email : Math.random()*1000+'', {s: '100', d: 'monsterid'}),
			cardColor: '#'+paddedColor
		}
	});
};

/**
 * GET as a host, force a user out of your room
 * @param	roomId	BitPoint RoomID
 * @param	name	Display name of user to kick
 */
exports.kick = function(req, res) {
	res.render('kick', {
		roomId: req.query.roomId,
		name: req.query.name
	});
};

/**
 * GET 404 Page
 */
exports.notFound = function(req, res) {
	res.status(404);
	res.render('httpError',{
		status: 404,
		url: req.url,
		bodyClass: 'one-column'
	});
};

