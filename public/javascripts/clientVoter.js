var
	socket = io.connect('http://'+window.location.host),
	roomId = bp.roomId,
	user = bp.user,
	avatar = bp.avatar;

$(function(){

	$('#cardStyle, #cardStylePop .close').on('click', function(e){
		$('#cardStylePop').toggle();
	});
	$('#pattern').on('change', function(e){
		$('.cardBack').removeClass('argile denim graphpaper paisley wood goat').addClass($(this).val());
	});
	$('#color').on('change', function(e){
		$('.cardBack').css('background-color', $(this).val());
	});

	socket.emit("joinRoom", {roomId: roomId, avatar: avatar, user: user});
	$('#estimateOptions td').on('click', function(e){
		$('.lastVote').removeClass('lastVote');
		var
			points = $(this).addClass('lastVote').text(),
			pattern = $('#pattern').val(),
			color = $('#color').val().length >= 4 ? $('#color').val() : '#032E63';
		socket.emit("sendVote", {roomId: roomId, user: user, estimate: points, pattern: pattern, color: color });
	});
	socket.on("newRound", function(data) {
		$('.lastVote').removeClass('lastVote');
		$('.status').hide().filter('.newRound').show();
	});
	socket.on("roundEnd", function(data) {
		$('.status').hide().filter('.roundEnd').show();
	});

	if(user == 'Noah'){
		$('#pattern').val('goat').change();
		$('#color').val('#EFC725').change();
	}

});
