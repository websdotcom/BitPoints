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

	DOM: {
		user: '#user',
		email: '#email',
		roomId: '#room-id',
		join: '#join',
		title: '#title',
		create: '#create'
	},

	initialize: function() {
		var userData = BP.localStorage.get('user-data');
		if(userData) {
			this.$user.val(userData.user);
			this.$email.val(userData.email);

			// If room ID is hidden, just join the room
			if(this.$roomId.attr('type') === 'hidden') {
				this.$join.trigger('submit');
			}
		}
	},

	joinRoom: function(e, $el) {
		if(validateForm($el)) {
			BP.localStorage.set('user-data',{
				user: this.$user.val(),
				email: this.$email.val()
			});
			document.location = '/join/' + this.$roomId.val() + '?user=' + this.$user.val() + '&email=' + this.$email.val();
		}
		e.preventDefault();
	},

	createRoom: function(e, $el) {
		if(validateForm($el)) {
			document.location = '/create/?title=' + this.$title.val();
		}
		e.preventDefault();
	}
});

page.init();