var gravatar = require('gravatar');

/*
 * GET home page
 */

exports.index = function(req, res){
  res.render('index');
};

exports.create = function(req, res) {
	var id = Math.floor(Math.random() * 50000);
	console.log(req.params);
	res.redirect('/roomHost/' + id + '/' + req.query.title);
};

exports.roomHost = function(req, res) {
	var
		id = req.params[0],
		title = req.params[1] ? req.params[1] : 'Room '+id;
	res.render('roomHost', {
		roomId: id,
		title: title
	});
}

exports.roomJoin = function(req, res) {
	res.render('roomJoin', {
		roomId: req.params.id,
		user: req.query.user,
		avatar: gravatar.url(req.query.email ? req.query.email : 'teamjirachat@gmail.com', {s: '100', d: 'monsterid'}),
		cardColor: '#'+Math.floor(Math.random()*16777215).toString(16)
	});
}

exports.addTicketCookie = function(req, res) {
	res.cookie('ticketSystem', req.query.ticketSystem, { maxAge: 900000 });
	res.cookie('ticketHost', req.query.ticketHost, { maxAge: 900000 });
	res.cookie('ticketID', req.query.ticketID, { maxAge: 900000 });
	res.send({ status: 'OK' });
}
