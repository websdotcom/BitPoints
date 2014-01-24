var
	socket = io.connect('http://'+window.location.host),
	roomId = bp.roomId,
	user = bp.user,
	avatar = bp.avatar;

$(function(){
	var renderDeck = function(deck) {
		var deckTable = $('#estimateOptions'),
			openRow = true,
			deckString = '<tr>';

		for(var i = 0; i < deck.length; i++) {
			if((i+1)%3 === 1) { deckString += '<tr>'; openRow = true; }
			deckString += '<td data-value="'+deck[i].value+'"'+(deck[i].estimate==='coffee'?' class="coffee"':'')+'>'+deck[i].estimate+'</td>';
			if((i+1)%3 === 0) { deckString += '</tr>'; openRow = false; }
		}
		if(openRow) { deckString += '</tr>'; }
		deckTable.empty().append(deckString);
	};

	$('#cardStyle, #cardStylePop .close').on('click', function(e){
		$('#cardStylePop').toggle();
	});
	$('#pattern').on('change', function(e){
		$('.cardBack').removeClass('argile denim graphpaper paisley wood goat').addClass($(this).val());
	});
	$('#color').on('change', function(e){
		$('.cardBack').css('background-color', $(this).val());
	});

	socket.emit("joinRoom", {roomId: roomId, avatar: avatar, user: user});
	$('#estimateOptions').on('click', 'td', function(e){
		$('.lastVote').removeClass('lastVote');
		var
			points = $(this).addClass('lastVote').data('value'),
			value = $(this).html(),
			pattern = $('#pattern').val(),
			color = $('#color').val().length >= 4 ? $('#color').val() : '#032E63';
		socket.emit("sendVote", {roomId: roomId, user: user, estimate: points, cardValue: value, pattern: pattern, color: color });
	});
	socket.on("newRound", function(data) {
		$('.lastVote').removeClass('lastVote');
		$('.status').hide().filter('.newRound').show();
	});
	socket.on("roundEnd", function(data) {
		$('.status').hide().filter('.roundEnd').show();
	});

	if(user == 'Noah'){
		$('#pattern').val('goat').change();
		$('#color').val('#EFC725').change();
	}

	socket.on("deck", function(data) {
		renderDeck(data);
	});

});
