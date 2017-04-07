var bunyan = require('bunyan');

module.exports = bunyan.createLogger({
	name: 'bitpoints-logger',
	level: 'info'
});

