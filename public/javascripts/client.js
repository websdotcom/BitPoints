var
	socket = io.connect('http://'+window.location.host),
	roomId = bp.roomId,
	status = 0, // 0 - start, 1 - betting open, 2 - reveal
	tim = (function(){var d="{{",a="}}",e="[a-z0-9_][\\.a-z0-9_]*",c=new RegExp(d+"("+e+")"+a,"gim"),b;return function(f,g){return f.replace(c,function(j,l){var n=l.split("."),h=n.length,m=g,k=0;for(;k<h;k++){if(m===b||m===null){break;}m=m[n[k]];if(k===h-1){return m;}}});};}());
	userTemp = '<li data-user="{{user}}"><img src="{{avatar}}" /><h3>{{user}}</h3><div class="card"><div class="cardBack"></div><div class="cardInner"><div class="cardValue"></div></div></div></li>';

socket.emit("createRoom", {roomId: roomId});

socket.on("newVoter", function(data) {
	$(tim(userTemp, data)).appendTo('#users');
});

socket.on("incomingVote", function(data) {
	if(status == 1){
		var $card = $('li[data-user='+data.user+'] div.card');
		$card.find('div.cardValue').text(data.estimate);
		$card.find('.cardBack').css('background-color', data.color);
		$card.addClass('visible')
	}
});

$('#toggleRound').on('click', function(e){
	status++; if(status == 3){ status = 1; }
	if(status == 1){ // Start a new round
		$('h2 span').text('Betting open');
		$('.card').removeClass('visible showValue');
	}else if(status == 2){ // Show cards
		$('h2 span').text('Betting closed');
		$('.card').addClass('showValue');
	}
});
