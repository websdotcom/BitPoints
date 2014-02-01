var
	socket = io.connect('http://'+window.location.host),
	roomId = BP.roomId,
	user = BP.user,
	avatar = BP.avatar,
	setCardAttr = function(attr,style) {
		BP.localStorage.set(user+'-card-'+attr,style);
	},
	getCardAttr = function(attr) {
		return BP.localStorage.get(user+'-card-'+attr);
	},
	initCardStyle = function() {

		// Noah is special
		if(user === 'Noah'){
			$('#pattern').val('goat').change();
			$('#color').val('#EFC725').change();
		}
		
		// Set any data that's in local storage
		if(getCardAttr('pattern')) {
			$('#pattern').val(getCardAttr('pattern')).change();
		}

		if(getCardAttr('color')) {
			$('#color').val(getCardAttr('color')).change();
		}

		// update local storage
		setCardAttr('pattern',$('#pattern').val());
		setCardAttr('color',$('#color').val());
	};

var page = new BP.Page({

	socket: socket,

	socketEvents: {
		'roomRefresh': 'joinRoom',
		'newRound': 'reset',
		'roundEnd': 'endRound',
		'deckChange': 'renderDeck',
		'kickVoter': 'processKick'
	},

	domEvents: {
		'click #cardStyle': 'toggleCardPopover',
		'click #closePopover': 'toggleCardPopover',
		'change #pattern': 'changeCardPattern',
		'change #color': 'changeCardColor',
		'click .estimate': 'submitEstimate'
	},

	initialize: function() {
		this.joinRoom();
		initCardStyle();
	},

	joinRoom: function(data) {
		socket.emit('joinRoom', {roomId: roomId, avatar: avatar, user: user});
	},

	reset: function(data) {
		$('.lastVote').removeClass('lastVote');
		if(data.ticket){ $('#ticketInfo').html(': <a href="'+data.ticket.url+'" target="_blank">'+data.ticket.key+'</a>'); }
		$('.status').hide().filter('.newRound').show();
	},

	endRound: function(data) {
		$('.status').hide().filter('.roundEnd').show();
	},

	processKick: function(data) {
		if(user === data.user) {
			socket.disconnect();
			document.location = '/kick/?roomId=' + roomId + '&user=' + user;
		}
	},

	renderDeck: function(deck) {
		var deckTable = $('#estimateOptions'),
			openRow = true,
			deckString = '<tr>';

		for(var i = 0; i < deck.length; i++) {
			if((i+1)%3 === 1) { deckString += '<tr>'; openRow = true; }
			deckString += '<td class="estimate" data-value="'+deck[i].value+'">'+deck[i].estimate+'</td>';
			if((i+1)%3 === 0) { deckString += '</tr>'; openRow = false; }
		}
		if(openRow) { deckString += '</tr>'; }
		deckTable.empty().append(deckString);
	},

	toggleCardPopover: function(e, $el) {
		$('#cardStylePop').toggle();
	},

	changeCardPattern: function(e, $el) {
		$('.cardBack').removeClass('argyle denim graphpaper paisley wood goat').addClass($el.val());
		setCardAttr('pattern',$el.val());
	},

	changeCardColor: function(e, $el) {
		$('.cardBack').css('background-color', $el.val());
		setCardAttr('color',$el.val());
	},

	submitEstimate: function(e, $el) {
		$('.lastVote').removeClass('lastVote');

		var points = $el.addClass('lastVote').data('value'),
			estimate = $el.html(),
			pattern = $('#pattern').val(),
			color = $('#color').val().length >= 4 ? $('#color').val() : '#032E63';
		socket.emit('newVote', {roomId: roomId, user: user, value: points, cardValue: estimate, pattern: pattern, color: color });
	}
});

page.init();