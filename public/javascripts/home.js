$(function(){
	$('#join').on('submit', function(e) {
		document.location = '/roomJoin/' + $('#room-id').val() + '?user=' + $('#user').val() + '&email=' + $('#email').val();
		e.preventDefault();
	});
	$('#create').on('submit', function(e) {
		document.location = '/create/?title=' + $('#title').val();
		e.preventDefault();
	});
});
