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
 */
exports.create = function(req, res) {
	// This number range will result in the base36 strings 1000 through zzzz
	var id = (46656 + Math.floor(Math.random() * 1632960)).toString(36).toLowerCase();
	res.redirect('/host/' + id);
};

/**
 * GET room UI
 * @param	id	BitPoint RoomID
 */
exports.host = function(req, res) {
	var id = req.params[0];

	res.cookie('roomID', id, { maxAge: 900000 });
	res.render('host', {
		room: {
			roomId: id
		},
		appHost: req.app.config.appHost
	});
};

/**
 * GET invite processing
 * @param  id  invite id in url
 */
exports.invite = function(req, res) {
	var roomId = req.query['room-id'];
	var room = {
		roomId: roomId
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

