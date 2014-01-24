var fs = require('fs');

/**
 * Read the JSON config file for the given environment
 * @param {string} env
 * @returns {Object|undefined} the config object, or undefined if the config file is not found
 */
var getConfig = function(env) {
	var environmentFile = "environments/" + env + ".json";
	var config;
	if (fs.existsSync(environmentFile)) {
		config = JSON.parse(fs.readFileSync(environmentFile));
		config.env = env;

		// Override port if PORT env variable is set.
		if(process.env.PORT) {
			config.port = parseInt(process.env.PORT);
		}

		return config;
	} else {
		return undefined;
	}
};

// Attempt to get config file. If no config.json is found, use a default config.
var ENVIRONMENT = process.env.NODE_ENV || 'development';

var config = getConfig(ENVIRONMENT);
if(!config) {
	process.exit(1);
}

exports.config = config;
