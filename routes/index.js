var gravatar = require('gravatar');

/**
 * GET homepage
 */
exports.index = function(req, res){
	res.render('index');
};

/**
 * GET create room from homepage
 * @param	title	Room name
 */
exports.create = function(req, res) {
	var id = Math.floor(Math.random() * 50000);
	res.redirect('/roomHost/' + id + '/' + req.query.title);
};

/**
 * GET room UI
 * @param	id	BitPoint RoomID
 * @param	title	Room name
 */
exports.roomHost = function(req, res) {
	var
		id = req.params[0],
		title = req.params[1] ? req.params[1] : 'Room '+id;
	res.render('roomHost', {
		roomId: id,
		title: title
	});
};

/**
 * GET voter UI
 * @param	id	BitPoint RoomID
 * @param	user	Display name of user
 * @param	email	Email address used for Gravatar
 */
exports.roomJoin = function(req, res) {
	var colorPad = "000000",
		color = Math.floor(Math.random()*16777215).toString(16)
		paddedColor = colorPad.substring(0,6-color.length)+color;

	res.render('roomJoin', {
		roomId: req.params.id,
		user: req.query.user || generateName(),
		avatar: gravatar.url(req.query.email ? req.query.email : 'teamjirachat@gmail.com', {s: '100', d: 'monsterid'}),
		cardColor: '#'+paddedColor
	});
};

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

var generateName = function() {
	var prefixes = ["Proud", "Awesome", "Totally", "Mega", "Tubular"];
	var names = ["Abaddon","Alchemist","Ancient Apparition","Anti"-"Mage","Axe","Bane","Batrider","Beastmaster","Bloodseeker","Bounty Hunter","Brewmaster","Bristleback","Broodmother","Centaur Warrunner","Chaos Knight","Chen","Clinkz","Clockwerk","Crystal Maiden","Dark Seer","Dazzle","Death Prophet","Disruptor","Doom","Dragon Knight","Drow Ranger","Earth Spirit","Earthshaker","Elder Titan","Ember Spirit","Enchantress","Enigma","Faceless Void","Gyrocopter","Huskar","Invoker","Jakiro","Juggernaut","Keeper of the Light","Kunkka","Legion Commander","Leshrac","Lich","Lifestealer","Lina","Lion","Lone Druid","Luna","Lycanthrope","Magnus","Medusa","Meepo","Mirana","Morphling","Naga Siren","Nature's Prophet","Necrolyte","Night Stalker","Nyx Assassin","Ogre Magi","Omniknight","Outworld Devourer","Phantom Assassin","Phantom Lancer","Puck","Pudge","Pugna","Queen of Pain","Razor","Riki","Rubick","Sand King","Shadow Demon","Shadow Fiend","Shadow Shaman","Silencer","Skeleton King","Skywrath Mage","Slardar","Slark","Sniper","Spectre","Spirit Breaker","Storm Spirit","Sven","Templar Assassin","Tidehunter","Timbersaw","Tinker","Tiny","Treant Protector","Troll Warlord","Tusk","Undying","Ursa","Vengeful Spirit","Venomancer","Viper","Visage","Warlock","Weaver","Windrunner","Wisp","Witch Doctor","Zeus"];
	return prefixes[Math.floor(Math.random() * prefixes.length)] + " " + names[Math.floor(Math.random() * names.length)];
}