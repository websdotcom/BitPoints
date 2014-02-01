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
			{ value: NaN, estimate: '&infin;' },
			{ value: NaN, estimate: '<i class="fa fa-coffee"></i>' }
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
			{ value: NaN, estimate: '&infin;' },
			{ value: NaN, estimate: '<i class="fa fa-coffee"></i>' }
		]
	},

	socket = io.connect('http://'+window.location.host),

	roomId = BP.roomId,
	title = BP.title,

	votes = {},
	voteData = {},

	roundStatus = 0, // 0 - start, 1 - betting open, 2 - reveal

	// TODO: Swap out with a legit templating setup?
	tim = (function(){var d='{{',a='}}',e='[a-z0-9_][\\.a-z0-9_]*',c=new RegExp(d+'('+e+')'+a,'gim'),b;return function(f,g){return f.replace(c,function(j,l){var n=l.split('.'),h=n.length,m=g,k=0;for(;k<h;k++){if(m===b||m===null){break;}m=m[n[k]];if(k===h-1){return m;}}});};}()),
	userTemp = '<li data-user="{{user}}"><div title="Remove this voter from room" class="kickVoter">&times;</div><img class="voterImage" src="{{avatar}}" /><h3 class="voterName">{{user}}</h3><div class="card"><div class="cardBack"></div><div class="cardInner"><div class="cardValue"></div><div class="cornerValue topleft"></div><div class="cornerValue bottomright"></div></div></div></li>',
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

		BP.each(votes, function(vote, user) {
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
		'click .kickVoter': 'kickVoter',
		'click .setting': 'toggleSettingMenu',
		'click #showLink': 'showShareLink',
		'click #toggleRound': 'toggleRound'
	},

	initialize: function() {
		socket.emit('createRoom', {roomId: roomId, title: title});
	},

	addVoter: function(data) {
		$(tim(userTemp, data)).appendTo('#users');
		this.updateVoterDecks();
	},

	removeVoter: function(data) {
		$('li[data-user="' + data.name + '"]').remove();
	},

	updateTicket: function(data) {
		BP.currentTicket = data;
		$('#ticket').html(tim(ticketTemp, data));
	},

	acceptVote: function(data) {
		if(roundStatus === 1){
			var $card = $('li[data-user="'+data.user+'"] .card'),
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
			votes[data.user] = data.value;
		}
	},

	updateVoterDecks: function(e, $el) {
		socket.emit('deckChange',getDeck());
	},

	kickVoter: function(e, $el) {
		socket.emit('kickVoter',{roomId:roomId,user:$el.parent().data('user')});
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

	toggleRound: function(e, $el){

		roundStatus = (roundStatus % 2) + 1;

		if(roundStatus === 1) { // Start a new round

			$('#average').hide().find('.val').empty();
			$('#largeSpread').hide();
			$el.text('Stop Estimating');
			$('.card').removeClass('visible showValue spin');

			// wait until cards are fully hidden to remove classes and emit events
			window.setTimeout(function(){
				$('.cardValue').removeClass('coffee min max');
				$('.cornerValue').removeClass('coffee');
				socket.emit('newRound', {roomId: roomId, ticket: BP.currentTicket});
			},600);

			// Clear out all votes
			votes = {};

		} else if(roundStatus === 2) { // Show cards

			$el.text('Begin Estimating');
			$('.card').addClass('showValue');

			processVotes();
			
			// If there's only one person, vote data is useless
			if(voteData.numVotes > 1) {

				// Only show average if there is less than a three-card gap between lowest and highest votes
				if(voteData.spread < 3) {
					$('#average').show().find('.val').text(voteData.average);
				} else {
					$('#largeSpread').show();
				}

				// Animate fun-times if everyone votes the same
				if(voteData.numVotes > 3 && voteData.allVotesEqual){
					$('.card').addClass('spin');
				}
			}

			$('.card .cardValue').each(function(i, el) {
				var $card = $(el),
					vote = $card.text();

				if(voteData.min === vote) {
					$card.addClass('min');
				}
				if(voteData.max === vote) {
					$card.addClass('max');
				}
			});
			socket.emit('roundEnd',{roomId: roomId});
		}
	}
});

page.init();
