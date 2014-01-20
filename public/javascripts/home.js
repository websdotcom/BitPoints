$(function(){
	$("#join-room").click(function() {
		document.location = "/roomJoin/" + $("#room-id").val();
	});
});