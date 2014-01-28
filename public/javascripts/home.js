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
	$('#join').on('submit', function(e) {
		if(validateForm($(this))) {
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
});
