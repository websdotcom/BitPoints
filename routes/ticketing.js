/**
 * GET set cookie from ticketing systems
 * @param	ticketSystem	Ticketing app slug: jira|bugzilla\githubIssues|...
 * @param	ticketHost	Domain ticketSystem is running on
 * @param	ticketID	Key of last ticket viewed
 */
exports.addTicketCookie = function(req, res) {
	res.cookie('ticketSystem', req.query.ticketSystem, { maxAge: 900000 });
	res.cookie('ticketHost', req.query.ticketHost, { maxAge: 900000 });
	res.cookie('ticketID', req.query.ticketID, { maxAge: 900000 });
	res.send({ status: 'OK' });
};
