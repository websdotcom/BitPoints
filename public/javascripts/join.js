var
	socket = io.connect('http://'+window.location.host),
	roomId = BP.room.roomId,
	name = BP.user.name,
	avatar = BP.user.avatar,
	roomName = 'BitPoints',
	uid,
	cardStyleTemp = '<label for="pattern">Pattern'+
						'<select id="pattern">'+
							'<option value="argyle">Argyle</option>'+
							'<option value="denim">Denim</option>'+
							'<option value="graphpaper">Graph Paper</option>'+
							'<option value="paisley">Paisley</option>'+
							'<option value="wood">Wood</option>'+
							'<option value="goat">Goat</option>'+
						'</select>'+
					'</label>'+
					'<label for="color">Color'+
						'<input title="Select card color" type="color" value="{{cardColor}}" id="color"/>'+
					'</label>';

var page = new BP.Page({

	socket: socket,

	socketEvents: {
		'roomRefresh': 'joinRoom',
		'newRound': 'reset',
		'roundEnd': 'endRound',
		'deckChange': 'renderDeck',
		'kickVoter': 'processKick',
		'uidAssignment': 'saveUid',
		'roomName': 'updateRoomName'
	},

	domEvents: {
		'click #cardStyle': 'toggleCardPopover',
		'change #pattern': 'changeCardPattern',
		'change #color': 'changeCardColor',
		'click .estimate': 'submitEstimate'
	},

	DOM: {
		cardBack: '.cardBack',
		lastVote: '.lastVote',
		ticketInfo: '#ticketInfo',
		status: '.status',
		estimateTable: '#estimateOptions',
		roomName: '#roomName'
	},

	initialize: function() {
		var html = BP.template(cardStyleTemp, { cardColor: BP.user.cardColor });

		this.cardStyleModal = new BP.Modal({
			id: 'cardStylePop',
			content: html,
			size: 'small'
		});

		this.addDOM({
			pattern: '#pattern',
			color: '#color'
		});

		this.joinRoom();
		this.initCardStyle();
	},

	updateRoomName: function(data) {
		this.$roomName.text(data.name);
	},

	setCardAttr: function(attr,style) {
		BP.localStorage.set(name+'-card-'+attr,style);
	},

	getCardAttr: function(attr) {
		return BP.localStorage.get(name+'-card-'+attr);
	},

	initCardStyle: function() {

		// Noah is special
		if(name === 'Noah'){
			this.$pattern.val('goat').change();
			this.$color.val('#EFC725').change();
		}

		// Set any data that's in local storage
		if(this.getCardAttr('pattern')) {
			this.$pattern.val(this.getCardAttr('pattern')).change();
		}

		if(this.getCardAttr('color')) {
			this.$color.val(this.getCardAttr('color')).change();
		}

		// update local storage
		this.setCardAttr('pattern',this.$pattern.val());
		this.setCardAttr('color',this.$color.val());
	},

	joinRoom: function(data) {
		socket.emit('joinRoom', {roomId: roomId, avatar: avatar, name: name});
	},

	reset: function(data) {
		this.$lastVote.removeClass('lastVote');
		if(data.ticket){ this.$ticketInfo.html(': <a href="'+data.ticket.url+'" target="_blank">'+data.ticket.key+'</a>'); }
		this.$status.hide().filter('.newRound').show();
	},

	endRound: function(data) {
		this.$status.hide().filter('.roundEnd').show();
	},

	processKick: function(data) {
		if(uid === data.uid) {
			socket.disconnect();
			document.location = '/kick/?roomId=' + roomId + '&name=' + name;
		}
	},

	saveUid: function(data) {
		console.log(data);
		uid = data.uid;
	},

	renderDeck: function(deck) {
		var deckTable = this.$estimateTable,
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
		this.cardStyleModal.toggle();
	},

	changeCardPattern: function(e, $el) {
		this.$cardBack.removeClass('argyle denim graphpaper paisley wood goat').addClass($el.val());
		this.setCardAttr('pattern',$el.val());
	},

	changeCardColor: function(e, $el) {
		this.$cardBack.css('background-color', $el.val());
		this.setCardAttr('color',$el.val());
	},

	submitEstimate: function(e, $el) {
		$('.lastVote').removeClass('lastVote');

		var points = $el.addClass('lastVote').data('value'),
			estimate = $el.html(),
			pattern = this.$pattern.val(),
			color = this.$color.val().length >= 4 ? this.$color.val() : '#032E63';
		socket.emit('newVote', {uid: uid, roomId: roomId, name: name, value: points, cardValue: estimate, pattern: pattern, color: color });
	}
});

page.init();