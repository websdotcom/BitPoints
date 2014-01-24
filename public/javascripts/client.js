var
	socket = io.connect('http://'+window.location.host),
	roomId = bp.roomId,
	title = bp.title,
	votes = {},
	status = 0, // 0 - start, 1 - betting open, 2 - reveal
	tim = (function(){var d="{{",a="}}",e="[a-z0-9_][\\.a-z0-9_]*",c=new RegExp(d+"("+e+")"+a,"gim"),b;return function(f,g){return f.replace(c,function(j,l){var n=l.split("."),h=n.length,m=g,k=0;for(;k<h;k++){if(m===b||m===null){break;}m=m[n[k]];if(k===h-1){return m;}}});};}());
	userTemp = '<li data-user="{{user}}"><img class="voterImage" src="{{avatar}}" /><h3 class="voterName">{{user}}</h3><div class="card"><div class="cardBack"></div><div class="cardInner"><div class="cardValue"></div></div></div></li>',
	voteData = {},
	getVoteFromCardValue = function(val) {
		if(val === '&frac12;') { return 0.5; }
		return parseFloat(val);
	}
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
					if(voteData.lastVote == -1){
						voteData.lastVote = vote;
						voteData.min = vote;
						voteData.max = vote;
					}
					if(voteData.lastVote != vote){ voteData.allVotesEqual = false; }
					if(voteData.max < vote){ voteData.max = vote; }
					if(voteData.min > vote){ voteData.min = vote; }
					voteData.numVotes++;
				}
			}
		}
		voteData.average = voteData.numVotes === 0 ? 0 : voteData.total/voteData.numVotes;
		if(voteData.average > 0.5) { voteData.average = Math.ceil(voteData.average); }
	};

socket.emit("createRoom", {roomId: roomId, title: title});

socket.on("newVoter", function(data) {
	$(tim(userTemp, data)).appendTo('#users');
});

socket.on("incomingVote", function(data) {
	if(status == 1){
		var $card = $('li[data-user='+data.user+'] div.card');
		$card.find('div.cardValue').html(data.cardValue);
		if(data.cardValue === 'coffee') { $card.find('div.cardValue').addClass('coffee'); }
		$card.find('.cardBack').css('background-color', data.color).removeClass('argile denim graphpaper paisley wood goat').addClass(data.pattern);
		$card.addClass('visible');
		votes[data.user] = data.estimate;
	}
});

$('#toggleRound').on('click', function(e){
	status++; if(status == 3){ status = 1; }
	if(status == 1){ // Start a new round
		$('#average').hide().find('.val').empty();
		$(this).text('Stop Estimating');
		$('.card').removeClass('visible showValue spin');
		$('.cardValue').removeClass('coffee min max');
		socket.emit("newRound",{roomId: roomId});
		votes = {};
	}else if(status == 2){ // Show cards

		$(this).text('Begin Estimating '+document.cookie.replace(/(?:(?:^|.*;\s*)ticketID\s*\=\s*([^;]*).*$)|^.*$/, "$1"));
		$('.card').addClass('showValue');
		processVotes();
		$('#average').show().find('.val').text(voteData.average);
		if(voteData.numVotes > 3 && voteData.allVotesEqual){
			$('.card').addClass('spin');
		}
		$('.card div.cardValue').each(function(i, el){
			var
				$card = $(el),
				vote = $card.text();
			if(voteData.min == vote)
				$card.addClass('min');
			if(voteData.max == vote)
				$card.addClass('max');
		});
		socket.emit("roundEnd",{roomId: roomId});
	}
});

