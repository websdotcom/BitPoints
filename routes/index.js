
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};

exports.create = function(req, res) {
	var id = Math.floor(Math.random() * 50000);
	res.redirect('/room/' + id);
};

exports.room = function(req, res) {
	res.render('room', {roomId: req.params.id});
}