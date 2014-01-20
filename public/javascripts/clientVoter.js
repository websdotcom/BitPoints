var socket = io.connect('http://localhost:3000');

var roomId = window.location.pathname.split("/")[2];
socket.emit("joinRoom", {roomId: roomId});
