
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};

exports.create = function(req, res) {
	var id = Math.floor(Math.random() * 50000);
	res.redirect('/roomHost/' + id);
};

exports.roomHost = function(req, res) {
	res.render('roomHost', {roomId: req.params.id});
}

exports.roomJoin = function(req, res) {
	res.render('roomJoin', {roomId: req.params.id});
}