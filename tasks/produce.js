/*
 * grunt-produce
 * https://github.com/mkatanski/grunt-produce
 *
 * Copyright (c) 2015 Michał Katański
 * Licensed under the MIT license.
 */

var ProduceModule = require('../lib/ProduceModule.js');

module.exports = function (grunt) {
    'use strict';

    var MODULE_NAME = 'produce';
    var MODULE_DESC = 'Automating the process of creating project files';

    grunt.registerMultiTask(MODULE_NAME, MODULE_DESC, function () {

        // Merge task-specific and/or target-specific template with these defaults.
        var _options = this.options({
            'templateFile' : ''
        });
        // Create new ProduceModule instance
        var produce = new ProduceModule(grunt);

        // Prevent running multiple targets
        if (grunt.cli.tasks.toString() === MODULE_NAME) {
            grunt.log.writeln(
                'You have to specify your target. Possible locals for ' +
                    grunt.task.current.target + ' are:'
            );

            for (var variableName in _options.locals) {
                if (!_options.locals.hasOwnProperty(variableName)) {
                    continue;
                }
                grunt.log.writeln('--' + variableName);
            }
            // stop grunt task
            return true;
        }

        try {
            // setup ProduceModule
            produce.setup(_options);
        }
        catch(err) {
            grunt.fail.fatal(err);
        }

        // If prompting for locals is required
        if(produce.promptUser) {
            produce.promptUserAsync(this.async(), function(){
                try {
                    produce.saveFile();
                }
                catch(err) {
                    grunt.fail.fatal(err);
                }
            });
        } else {
            try {
                produce.saveFile();
            }
            catch(err) {
                grunt.fail.fatal(err);
            }
        }

    });
};
