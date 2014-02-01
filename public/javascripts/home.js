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

var page = new BP.Page({

	domEvents: {
		'submit #join': 'joinRoom',
		'submit #create': 'createRoom'
	},

	initialize: function() {
		var userData = BP.localStorage.get('user-data');

		if(userData) {
			$('#user').val(userData.user);
			$('#email').val(userData.email);

			// If room ID is hidden, just join the room
			if($('#room-id').attr('type') === 'hidden') {
				$('#join').trigger('submit');
			}
		}
	},

	joinRoom: function(e) {
		if(validateForm($(this))) {
			BP.localStorage.set('user-data',{
				user:$('#user').val(),
				email:$('#email').val()
			});
			document.location = '/join/' + $('#room-id').val() + '?user=' + $('#user').val() + '&email=' + $('#email').val();
		}
		e.preventDefault();
	},

	createRoom: function(e) {
		if(validateForm($(this))) {
			document.location = '/create/?title=' + $('#title').val();
		}
		e.preventDefault();
	}
});

page.init();