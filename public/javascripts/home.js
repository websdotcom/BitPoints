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
		'submit #create': 'createRoom',
		'click #notifications': 'allowNotifications',
		'focus #title': 'showRoomOptions'
	},

	DOM: {
		name: '#name',
		email: '#email',
		roomId: '#room-id',
		join: '#join',
		title: '#title',
		create: '#create',
		roomOptions: '.roomOptions',
		notifications: '#notifications'
	},

	initialize: function() {
		var userData = BP.localStorage.get('user-data');
		if(userData) {
			this.$name.val(userData.name);
			this.$email.val(userData.email);

			// If room ID is hidden, just join the room
			if(this.$roomId.attr('type') === 'hidden') {
				this.$join.trigger('submit');
			}
		}
		if(!BP.Notification.supported) {
			this.$notifications.parent('label').hide();
		} else {
			if(BP.localStorage.get('useNotifications')) {
				this.$notifications.trigger('click');
			}
		}
	},

	joinRoom: function(e, $el) {
		if(validateForm($el)) {
			BP.localStorage.set('user-data',{
				name: this.$name.val(),
				email: this.$email.val()
			});
			document.location = '/join/' + this.$roomId.val() + '?name=' + this.$name.val() + '&email=' + this.$email.val();
		}
		e.preventDefault();
	},

	createRoom: function(e, $el) {
		if(validateForm($el)) {
			document.location = '/create/?title=' + this.$title.val();
		}
		e.preventDefault();
	},

	showRoomOptions: function(e, $el) {
		this.$roomOptions.addClass('visible');
	},

	allowNotifications: function(e, $el) {
		var hasPermission = BP.Notification.hasPermission(),
			wantsNotifications = $el.is(':checked');

		BP.localStorage.set('useNotifications',wantsNotifications);

		if(wantsNotifications && !hasPermission) {
			BP.Notification.requestPermission();
		}
	}
});

page.init();
