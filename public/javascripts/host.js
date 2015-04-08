var
	decks = {
		'standard': [
			{ value: NaN, estimate: '?' },
			{ value: 0, estimate: '0' },
			{ value: 0.5, estimate: '&frac12;' },
			{ value: 1, estimate: '1' },
			{ value: 2, estimate: '2' },
			{ value: 3, estimate: '3' },
			{ value: 5, estimate: '5' },
			{ value: 8, estimate: '8' },
			{ value: 13, estimate: '13' },
			{ value: 20, estimate: '20' },
			{ value: 40, estimate: '40' },
			{ value: 100, estimate: '100' },
			{ value: Infinity, estimate: '&infin;' },
			{ value: NaN, estimate: '<i class="fa fa-coffee"></i>' },
			{ value: NaN, estimate: 'ಠ_ಠ'}
		],
		'fibonacci': [
			{ value: NaN, estimate: '?' },
			{ value: 0, estimate: '0' },
			{ value: 1, estimate: '1' },
			{ value: 2, estimate: '2' },
			{ value: 3, estimate: '3' },
			{ value: 5, estimate: '5' },
			{ value: 8, estimate: '8' },
			{ value: 13, estimate: '13' },
			{ value: 21, estimate: '21' },
			{ value: 34, estimate: '34' },
			{ value: 55, estimate: '55' },
			{ value: 89, estimate: '89' },
			{ value: Infinity, estimate: '&infin;' },
			{ value: NaN, estimate: '<i class="fa fa-coffee"></i>' },
			{ value: NaN, estimate: 'ಠ_ಠ'}
		],
		'letters': [
			{ value: 0, estimate: 'A' },
			{ value: 1, estimate: 'B' },
			{ value: 2, estimate: 'C' },
			{ value: 3, estimate: 'D' },
			{ value: 4, estimate: 'E' },
			{ value: 5, estimate: 'F' },
			{ value: NaN, estimate: '?' },
			{ value: NaN, estimate: '<i class="fa fa-coffee"></i>' }
		],
		'tshirt': [
			{ value: 0, estimate: 'XS' },
			{ value: 1, estimate: 'S' },
			{ value: 2, estimate: 'M' },
			{ value: 3, estimate: 'L' },
			{ value: 4, estimate: 'XL' },
			{ value: NaN, estimate: '?' },
			{ value: Infinity, estimate: '&infin;' },
			{ value: NaN, estimate: '<i class="fa fa-coffee"></i>' }
		]
	},

	socket = io.connect('http://'+window.location.host),

	roomId = BP.room.roomId,
	title = BP.room.title,

	votes = {},
	voteData = {},

	roundStatus = 0, // 0 - start, 1 - betting open, 2 - reveal

	userTemp =  '<li data-name="{{name}}" data-uid="{{uid}}">'+
					'<div title="Don\'t count this voter\'s estimates" class="ಠ_ಠ"><i class="fa fa-eye"></i></div>'+
					'<div title="Remove this voter from room" class="kickVoter">&times;</div>'+
					'<img class="voterImage" src="{{avatar}}" />'+
					'<h3 class="voterName">{{name}}</h3>'+
					'<div class="card">'+
						'<div class="cardBack"></div>'+
						'<div class="cardInner">'+
							'<div class="cardValue"></div>'+
							'<div class="cornerValue topleft"></div>'+
							'<div class="cornerValue bottomright"></div>'+
						'</div>'+
					'</div>'+
				'</li>',

	ticketTemp = '<a href="{{url}}" class="key" target="_blank">{{key}}</a>: <span class="title">{{title}}</span>',

	getDeck = function() {
		return decks[$('input[name=deckType]:checked').val() || 'standard'];
	},

	getValueFromEstimate = function(estimate) {
		var deck = getDeck(),
			ret = NaN;

		for(var i = 0; i < deck.length; i++) {
			if(deck[i].estimate === estimate) {
				return deck[i].value;
			}
		}
	},

	getNumVotes = function() {
		var count = 0;
		BP.each(votes,function() {
			count++;
		});
		return count;
	},

	processVotes = function() {
		voteData = {
			average: -1,
			min: -1,
			max: -1,
			allVotesEqual: true,
			lastVote: -1,
			total: 0,
			numVotes: 0,
			spread: 0
		};
		var vote,
			deck = getDeck(),
			minCardIdx = 0, maxCardIdx = 0;

		BP.each(votes, function(vote, name) {
			if(!isNaN(vote)) {
				voteData.total += vote;
				if(voteData.lastVote === -1){
					voteData.lastVote = vote;
					voteData.min = vote;
					voteData.max = vote;
				}
				if(voteData.lastVote !== vote){ voteData.allVotesEqual = false; }
				if(voteData.max < vote){ voteData.max = vote; }
				if(voteData.min > vote){ voteData.min = vote; }
				voteData.numVotes++;
			}
		});

		BP.each(deck, function(card, i) {
			if(card.value === voteData.min) { minCardIdx = i; }
			if(card.value === voteData.max) { maxCardIdx = i; }
		});

		voteData.spread = maxCardIdx - minCardIdx;
		voteData.average = voteData.numVotes === 0 ? 0 : voteData.total/voteData.numVotes;
		if(voteData.average > 0.5) { voteData.average = Math.ceil(voteData.average); }
	};

var page = new BP.Page({

	socket: socket,

	domRoot: '#room',

	socketEvents: {
		'newVoter': 'addVoter',
		'voterLeave': 'removeVoter',
		'updateTicket': 'updateTicket',
		'newVote': 'acceptVote'
	},

	domEvents: {
		'change input[name=deckType]': 'updateVoterDecks',
		'click .ಠ_ಠ': 'ಠ_ಠ',
		'click .kickVoter': 'kickVoter',
		'click .setting': 'toggleSettingMenu',
		'click #showLink': 'showShareLink',
		'click #toggleRound': 'toggleRound'
	},

	DOM: {
		users: '#users',
		ticket: '#ticket',
		average: '#average',
		largeSpread: '#largeSpread'
	},

	initialize: function() {
		socket.emit('createRoom', {roomId: roomId, title: title});
		this.useNotifications = BP.localStorage.get('useNotifications');
		var inviteId = $("#showLink").attr('data-link');
		$("#showLink").attr('data-link', document.location.host + '/' + inviteId);
		$("#inviteUrl").text(document.location.host + '/' + inviteId);
	},

	addVoter: function(data) {
		data.name = escape(data.name);
		var html = BP.template(userTemp, data);
		$(html).appendTo(this.$users);
		this.updateVoterDecks();
	},

	removeVoter: function(data) {
		this.$('li[data-uid="' + data.uid + '"]').remove();
	},

	updateTicket: function(data) {
		BP.currentTicket = data;
		this.$ticket.html(BP.template(ticketTemp, data));
	},

	acceptVote: function(data) {
		if(roundStatus === 1){
			var
				$voter = this.$('li[data-uid="'+data.uid+'"]'),
				$card = $voter.find('.card'),
				$mainValue = $card.find('.cardValue'),
				$cornerValues = $card.find('.cornerValue'),
				$cardBack = $card.find('.cardBack');

			$mainValue.html(data.cardValue);
			$cornerValues.html(data.cardValue);
			if(data.cardValue === 'coffee') {
				$mainValue.addClass('coffee');
				$cornerValues.addClass('coffee');
			}
			$cardBack.css('background-color', data.color).removeClass('argyle denim graphpaper paisley wood goat').addClass(data.pattern);
			$card.addClass('visible');

			if(!$voter.data('observer'))
				votes[data.uid] = data.value;

			if(this.useNotifications && getNumVotes() === this.$users.find('li:not([data-observer=true])').length) {
				BP.Notification.send({
					title: 'BitPoints - '+BP.room.title,
					body: 'All votes are in!'
				});
			}

		}
	},

	updateVoterDecks: function(e, $el) {
		socket.emit('deckChange',getDeck());
	},

	ಠ_ಠ: function(e, $el) {
		$el.parent().attr('data-observer', $el.parent().attr('data-observer') != 'true');
	},

	kickVoter: function(e, $el) {
		socket.emit('kickVoter',{roomId:roomId,uid:$el.parent().data('uid')});
	},

	toggleSettingMenu: function(e, $el) {
		$el.siblings().find('.drop').removeClass('active');
		$el.next('.drop').toggleClass('active');
	},

	showShareLink: function(e, $el) {
		var link = $el.data('link'),
			modal = new BP.Modal({
				id: 'inviteLink',
				content: link,
				size: 'large'
			});

		modal.show();
	},

	startNewRound: function(e, $el) {
		this.$average.hide().find('.val').empty();
		this.$largeSpread.hide();
		$el.text('Stop Estimating');
		this.$('.card').removeClass('visible showValue spin');
		$el.css('backgroundColor', '#2581FF');
		$('html').css('backgroundColor', '#A4CC09');

		// Clear out all votes
		votes = {};

		// wait until cards are fully hidden to remove classes and emit events
		window.setTimeout(function(){
			self.$('.cardValue').removeClass('coffee min max');
			self.$('.cornerValue').removeClass('coffee');
			socket.emit('newRound', {roomId: roomId, ticket: BP.currentTicket});
		},1500);
	},

	endCurrentRound: function(e, $el) {
		$el.text('Begin Estimating');
		this.$('.card').addClass('showValue');
		$('html').css('backgroundColor', '#2581FF');
		$el.css('backgroundColor', '#A4CC09');

		processVotes();

		// If there's only one person, vote data is useless
		if(voteData.numVotes > 1) {

			// Only show average if there is less than a three-card gap between lowest and highest votes
			if(voteData.spread < 3) {
				this.$average.show().find('.val').text(voteData.average);
			} else {
				this.$largeSpread.show();

				this.$('.card .cardValue').each(function(i, el) {
					// TODO: instead of highlighting low and high votes,
					// highlight the outliers (cards that are not in the middle two vote values)
					// e.g. for votes 1,3,8,13:  highlight 1 and 13
				});
			}

			// Animate fun-times if everyone votes the same
			if(voteData.numVotes > 3 && voteData.allVotesEqual){
				this.$('.card').addClass('spin');
			}
		}

		socket.emit('roundEnd',{roomId: roomId});
	},

	toggleRound: function(e, $el){

		roundStatus = (roundStatus % 2) + 1;

		if(roundStatus === 1) {
			this.startNewRound(e, $el);
		} else if(roundStatus === 2) {
			this.endCurrentRound(e, $el);
		}
	}
});

page.init();
