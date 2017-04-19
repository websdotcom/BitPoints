var socket = io.connect('http://'+window.location.host);
var roomId = BP.room.roomId;
var username = BP.user.name;
var avatar = BP.user.avatar;
var uid;

var voterTemp = '<img class="voterImageSmall" title="{{name}}" src="{{avatar}}" />';

var cardStyleTemp = '<label for="pattern">Pattern'+
		'<select id="pattern">'+
			'<option value="denim">Denim</option>'+
			'<option value="graphpaper">Graph Paper</option>'+
			'<option value="paisley">Paisley</option>'+
			'<option value="wood">Wood</option>'+
			'<option value="goat">Goat</option>'+
			'<option value="biggie">Biggie</option>'+
			'<option value="goodEvil">Good vs. Evil</option>'+
			'<option value="joker">Joker</option>'+
			'<option value="kingClubs">King of Clubs</option>'+
			'<option value="kittyHeart">Kitty Heart</option>'+
			'<option value="littlePickle">Little Pickle</option>'+
			'<option value="machoman">Macho Macho Man</option>'+
			'<option value="meh">meh</option>'+
			'<option value="metalhead">Metalhead</option>'+
			'<option value="organHugs">Organ Hugs</option>'+
			'<option value="retroGames">Retro Games</option>'+
			'<option value="space">Space #1</option>'+
			'<option value="space2">Space #2</option>'+
			'<option value="squid">Squid</option>'+
			'<option value="stormtrooper">Stormtrooper</option>'+
			'<option value="sweepTheLeg">"Sweep the leg"</option>'+
			'<option value="treeLungs">Tree Lungs</option>'+
			'<option value="tribe">Tribe</option>'+
			'<option value="trippy">Trippy</option>'+
			'<option value="whaleMelon">Whale Melon</option>'+
			'<option value="architects">Architects</option>'+
			'<option value="moonsharks">Moon Sharks</option>'+
			'<option value="rebelAlliance">Rebel Alliance</option>'+
			'<option value="spoon">Spoon</option>'+
			'<option value="watchmen">Watchmen</option>'+
			'<option value="tron">TRON</option>'+
		'</select>'+
	'</label>'+
	'<label for="color">Color'+
		'<input title="Select card color" type="color" value="{{cardColor}}" id="color"/>'+
	'</label>';

var page = new BP.Page({

	socket: socket,

	voting: false,

	socketEvents: {
		'roomRefresh': 'joinRoom',
		'newRound': 'reset',
		'roundEnd': 'endRound',
		'deckChange': 'renderDeck',
		'kickVoter': 'processKick',
		'uidAssignment': 'saveUid',
		'roomName': 'updateRoomName',
		'updateVoters': 'updateVoters'
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
		roomName: '#roomName',
		voterList: '#voterList .avatars'
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
		BP.localStorage.set(username+'-card-'+attr, style);
	},

	getCardAttr: function(attr) {
		return BP.localStorage.get(username+'-card-'+attr);
	},

	initCardStyle: function() {
		var patterns = $('#pattern option');

		// Noah is special
		if(username === 'Noah'){
			this.$pattern.val('goat').change();
			this.$color.val('#EFC725').change();
		}

		// Set any data that's in local storage
		if(this.getCardAttr('pattern')) {
			this.$pattern.val(this.getCardAttr('pattern')).change();
		} else {
			var randomPattern = Math.floor(patterns.length * Math.random());
			this.$pattern.val(patterns[randomPattern].value).change();
		}

		if(this.getCardAttr('color')) {
			this.$color.val(this.getCardAttr('color')).change();
		}

		// update local storage
		this.setCardAttr('pattern',this.$pattern.val());
		this.setCardAttr('color',this.$color.val());
	},

	joinRoom: function() {
		socket.emit('joinRoom', {roomId: roomId, avatar: avatar, name: username});
	},

	reset: function(data) {
		this.voting = true;
		this.$lastVote.removeClass('lastVote');
		if(data.ticket){ this.$ticketInfo.html(': <a href="'+data.ticket.url+'" target="_blank">'+data.ticket.key+'</a>'); }
		this.$status.hide().filter('.newRound').show();
		this.$estimateTable.removeClass('roundEnd').addClass('newRound');
	},

	endRound: function(data) {
		this.voting = false;
		var text = 'Voting is closed.';

		if (data.outcome) {
			text += ' Outcome: ' + data.outcome;
			if (data.nearestCard) {
				text += ' Nearest Card: ' + data.nearestCard;
			}
		}

		this.$status.hide().filter('.roundEnd').text(text).show();
		this.$estimateTable.removeClass('newRound').addClass('roundEnd');
	},

	updateVoters: function(data) {
		var voters = data.voters;
		var html = '';
		for (var uid in voters) {
			if (voters.hasOwnProperty(uid)) {
				html += BP.template(voterTemp, voters[uid]);
			}
		}
		this.$voterList.html(html);
	},

	processKick: function(data) {
		if(uid === data.uid) {
			socket.disconnect();
			document.location = '/kick/?roomId=' + roomId + '&name=' + username;
		}
	},

	saveUid: function(data) {
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

	toggleCardPopover: function() {
		this.cardStyleModal.toggle();
	},

	changeCardPattern: function(e, $el) {
		this.$cardBack.attr('class', 'cardBack').addClass($el.val());
		this.$cardBack.css('background-image', 'url(/images/cards/' + $el.val() + '.png)');
		this.setCardAttr('pattern', $el.val());
	},

	changeCardColor: function(e, $el) {
		this.$cardBack.css('background-color', $el.val());
		this.setCardAttr('color', $el.val());
	},

	submitEstimate: function(e, $el) {
		if (!this.voting) { return; }

		$('.lastVote').removeClass('lastVote');

		var points = $el.addClass('lastVote').data('value'),
			estimate = $el.html(),
			pattern = this.$cardBack.attr('class').split(/\s+/)[1],
			color = this.$color.val().length >= 4 ? this.$color.val() : '#032E63';
		socket.emit('newVote', {uid: uid, roomId: roomId, name: username, value: points, cardValue: estimate, pattern: pattern, color: color });
	}
});

page.init();
