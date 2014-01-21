var
	socket = io.connect('http://localhost:3000'),
	roomId = bp.roomId;

socket.emit("createRoom", {roomId: roomId});

socket.on("newVoter", function(data) {
	$('<li data-user="'+data.user+'" />').html('<img src="'+data.avatar+'" /> <span class="name">'+data.user+'</span> <span class="points"></span>').appendTo('#users');
});

socket.on("incomingVote", function(data) {
	$('li[data-user='+data.user+'] span.points').text(data.estimate);
});
