var validateForm = function(form) {
	var requiredFields = form.find('[data-required=true]');
	form.removeClass('error');

	requiredFields.each(function() {
		var field = $(this),
			val = field.val();
		if($.trim(val).length < 1) {
			field.addClass('error');
			form.addClass('error');
		} else {
			field.removeClass('error');
		}
	});

	return !form.hasClass('error');
};

$(function(){
	var userData = bp.getLocalUserData();
	$('#join').on('submit', function(e) {
		if(validateForm($(this))) {
			bp.setLocalItem('user-data',{
				user:$('#user').val(),
				email:$('#email').val()
			});
			document.location = '/roomJoin/' + $('#room-id').val() + '?user=' + $('#user').val() + '&email=' + $('#email').val();
		}
		e.preventDefault();
	});
	$('#create').on('submit', function(e) {
		if(validateForm($(this))) {
			document.location = '/create/?title=' + $('#title').val();
		}
		e.preventDefault();
	});
	if(userData) {
		$('#user').val(userData.user);
		$('#email').val(userData.email);
		// if room ID is hidden, just join the room
		if($('#room-id').attr('type') === 'hidden') {
			$('#join').trigger('submit');
		}
	}
});
