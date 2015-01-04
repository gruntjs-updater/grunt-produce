/*
 * grunt-create
 * https://github.com/mkatanski/grunt-create
 *
 * Copyright (c) 2015 Michał Katański
 * Licensed under the MIT license.
 */

var eachAsync = require('each-async'),
    path      = require('path');

module.exports = function(grunt) {

  'use strict';

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  var MODULE_NAME       = 'create',
      MODULE_DESC       = 'Automating the process of creating project files',
      NEW_LINE          = '\n',
      options           = {},
      parameters        = {},
      destinationFile   = '',
      template          = [];


  function expandString(str) {
    for (var paramName in parameters) {
      str = str.replace('{{'+paramName+'}}', parameters[paramName]);
    }
    return str;
  }

  function expandTemplate() {
    template.forEach(function(line, lineIndex){
      template[lineIndex] = expandString(line);
    });
  }

  function prepareParameters() {

    // Assign to paramaters object initial values
    parameters['username']        = options.username;
    parameters['email']           = options.email;
    parameters['version']         = options.version;

    if (grunt.util.kindOf(options.params) === 'array') {

      // for each defined paramater collect param value
      options.params.forEach(function (paramName) {
        // Assign param value to parameters object
        parameters[paramName] = grunt.option(paramName) || '';
      });
    }

  }

  grunt.registerMultiTask(MODULE_NAME, MODULE_DESC, function() {
    var async       = this.async(),
        _this       = this,
        _gitConfig  = {};

    // Get git config values for username and user e-mail
    eachAsync(['user.name', 'user.email'], function (item, index, done) {
      grunt.util.spawn({ cmd: 'git', args: ['config', item]}, function(error, result){
        // If result is stdout append git config value to gitConfig object
        if (result.stdout) {
          _gitConfig[item] = String(result);
        }
        // Set current async process as finished
        done();
      });
    }, function () {
      // All async processes are finished
      async();

      // Merge task-specific and/or target-specific options with these defaults.
      options = _this.options({
        'username'        : _gitConfig['user.name'] || '',
        'email'           : _gitConfig['user.email'] || '',
        'version'         : '0.1.0',
        'fileName'        : '{{name}}.ts',
        'cwd'             : ''
      });

      // Check if template file exists
      if(!grunt.file.exists(options.template)) {
        grunt.fail.fatal('Template doesn\'t exists! [' + options.template + ']');
      }

      // Read template file
      template  = grunt.file.read(options.template).split(NEW_LINE);

      // Collect all defined parameters
      prepareParameters();

      if (grunt.util.kindOf(options.fileNameResolve) === 'function') {
        options.fileName = options.fileNameResolve(parameters);
      }

      options.fileName = expandString(options.fileName);
      destinationFile = path.join(options.cwd, options.fileName);

      // Check if destination file exists
      if(grunt.file.exists(destinationFile)) {
        grunt.fail.fatal('Destination file exists! [' + destinationFile + ']');
      }

      expandTemplate();

      // Save file
      grunt.file.write(destinationFile, template.join(NEW_LINE));
      grunt.log.writeln('File saved as: ' + destinationFile);

    });
  });

};
