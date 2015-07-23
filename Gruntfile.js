module.exports = function(grunt) {

	// Loads any modules starting with 'grunt-'
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		jshint: {
			files: ['public/javascripts/', 'routes/', 'models/'],
			options: {
				jshintrc: '.jshintrc'
			}
		}
	});
};
