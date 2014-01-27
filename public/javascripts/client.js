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
			{ value: NaN, estimate: 'coffee' }
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
			{ value: NaN, estimate: 'coffee' }
		]
	},
	socket = io.connect('http://'+window.location.host),
	roomId = bp.roomId,
	title = bp.title,
	votes = {},
	roundStatus = 0, // 0 - start, 1 - betting open, 2 - reveal
	tim = (function(){var d='{{',a='}}',e='[a-z0-9_][\\.a-z0-9_]*',c=new RegExp(d+'('+e+')'+a,'gim'),b;return function(f,g){return f.replace(c,function(j,l){var n=l.split('.'),h=n.length,m=g,k=0;for(;k<h;k++){if(m===b||m===null){break;}m=m[n[k]];if(k===h-1){return m;}}});};}()),
	userTemp = '<li data-user="{{user}}"><img class="voterImage" src="{{avatar}}" /><h3 class="voterName">{{user}}</h3><div class="card"><div class="cardBack"></div><div class="cardInner"><div class="cardValue"></div><div class="cornerValue topleft"></div><div class="cornerValue bottomright"></div></div></div></li>',
	voteData = {},
	getDeck = function() {
		return decks[$('input[name=deckType]:checked').val() || 'standard'];
	},
	updateVoterDecks = function() {
		socket.emit('deckChange',getDeck());
	},
	getVoteFromCardValue = function(val) {
		if(val === '&frac12;') { return 0.5; }
		return parseFloat(val);
	},
	processVotes = function() {
		voteData = {
			average: -1,
			min: -1,
			max: -1,
			allVotesEqual: true,
			lastVote: -1,
			total: 0,
			numVotes: 0
		};
		var vote;
		for(var user in votes) {
			if(votes.hasOwnProperty(user)) {
				vote = getVoteFromCardValue(votes[user]);
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
			}
		}
		voteData.average = voteData.numVotes === 0 ? 0 : voteData.total/voteData.numVotes;
		if(voteData.average > 0.5) { voteData.average = Math.ceil(voteData.average); }
	};

socket.emit('createRoom', {roomId: roomId, title: title});

socket.on('newVoter', function(data) {
	$(tim(userTemp, data)).appendTo('#users');
	updateVoterDecks();
});

socket.on('newVote', function(data) {
	if(roundStatus === 1){
		var $card = $('li[data-user='+data.user+'] .card'),
			$mainValue = $card.find('.cardValue'),
			$cornerValues = $card.find('.cornerValue'),
			$cardBack = $card.find('.cardBack');

		$mainValue.html(data.cardValue);
		$cornerValues.html(data.cardValue);
		if(data.cardValue === 'coffee') {
			$mainValue.addClass('coffee');
			$cornerValues.addClass('coffee');
		}
		$cardBack.css('background-color', data.color).removeClass('argile denim graphpaper paisley wood goat').addClass(data.pattern);
		$card.addClass('visible');
		votes[data.user] = data.estimate;
	}
});

$('input[name=deckType]').on('change', function(e) {
	updateVoterDecks();
});

$('#toggleRound').on('click', function(e){
	roundStatus = (roundStatus%2)+1;
	if(roundStatus === 1){ // Start a new round
		$('#average').hide().find('.val').empty();
		$(this).text('Stop Estimating');
		$('.card').removeClass('visible showValue spin');
		// wait until cards are fully hidden to rmeove classes and emit events
		_.delay(function(){
			$('.cardValue').removeClass('coffee min max');
			$('.cornerValue').removeClass('coffee');
			socket.emit('newRound',{roomId: roomId});
			votes = {};
		},600);
	}else if(roundStatus === 2){ // Show cards
		$(this).text('Begin Estimating '+document.cookie.replace(/(?:(?:^|.*;\s*)ticketID\s*\=\s*([^;]*).*$)|^.*$/, '$1'));
		$('.card').addClass('showValue');
		processVotes();
		$('#average').show().find('.val').text(voteData.average);
		if(voteData.numVotes > 3 && voteData.allVotesEqual){
			$('.card').addClass('spin');
		}
		$('.card .cardValue').each(function(i, el){
			var
				$card = $(el),
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
});

// Warn the host user of the atrocity they are about to commit.
window.onbeforeunload = function() {
	return "Leaving or refreshing as the host of a room may cause one or more of "
		+ "the following:\n"
		+ "- The end of times\n"
		+ "- Your cat/dog/house catching fire\n"
		+ "- Votes and participants being lost";
}