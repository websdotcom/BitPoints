var
	socket = io.connect('http://localhost:3000'),
	roomId = bp.roomId,
	user = bp.user,
	avatar = bp.avatar;

$(function(){
	socket.emit("joinRoom", {roomId: roomId, avatar: avatar, user: user});
	$('#estimateOptions td').on('click', function(e){
		$('.lastVote').removeClass('lastVote')
		var
			points = $(this).addClass('lastVote').text(),
			color = $('#color').val().length >= 4 ? $('#color').val() : '#032E63';
		socket.emit("sendVote", {roomId: roomId, user: user, estimate: points, color: color });
	});
});
