function extendTicketInfo(ticket, req, res){
	switch(ticket.system){
	case 'jira': // assume v5/6 REST API enabled, we're not dealing with the SOAP interface
		ticket.url = 'http://' + ticket.host + '/browse/' + ticket.key;
		req.app.locals.io.sockets.in(req.cookies.roomID).emit('updateTicket', ticket);
		res.send({ status: 'OK' });
		break;
	default:
		console.error('Ticket system not recognized: '+ticket.ticketSystem);
		res.send({ status: 'FAIL' });
	}
}

/**
 * GET set cookie from ticketing systems
 * @param	ticketSystem	Ticketing app slug: jira|bugzilla\githubIssues|...
 * @param	ticketHost	Domain ticketSystem is running on
 * @param	ticketID	Key of last ticket viewed
 */
exports.addTicketCookie = function(req, res) {
	var ticket = {
		system: req.query.ticketSystem,
		host: req.query.ticketHost,
		key: req.query.ticketID,
		title: req.query.ticketTitle
	};

	res.cookie('ticketSystem', ticket.system, { maxAge: 900000 });
	res.cookie('ticketHost', ticket.host, { maxAge: 900000 });
	res.cookie('ticketID', ticket.key, { maxAge: 900000 });
	res.cookie('ticketTitle', ticket.title, { maxAge: 900000 });

	if(req.cookies.roomID){
		extendTicketInfo(ticket, req, res);
	}else{
		res.send({ status: 'OK' });
	}
};
