var socket = io.connect('http://localhost:3000');

var roomId = window.location.pathname.split("/")[2];
socket.emit("createRoom", {roomId: roomId});

socket.on("incomingVote", function(data) {
	console.log("Vote:", data);
})