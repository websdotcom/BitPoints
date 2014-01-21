var
	socket = io.connect('http://localhost:3000'),
	roomId = bp.roomId,
	user = bp.user,
	avatar = bp.avatar;

$(function(){
	socket.emit("joinRoom", {roomId: roomId, avatar: avatar, user: user});
	$('#estimateOptions li').on('click', function(e){
		var points = $(this).text();
		$('#estimate').text(points);
		socket.emit("sendVote", {roomId: roomId, user: user, estimate: points});
	});
});
