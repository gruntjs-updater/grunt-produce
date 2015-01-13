/*
 * ProduceModule
 * https://github.com/mkatanski/grunt-produce
 *
 * Copyright (c) 2015 Michał Katański
 * Licensed under the MIT license.
 */

var ProduceModule = (function () {

    require('shelljs/global');

    function ProduceModule(grunt) {
        this.grunt = grunt;

        this.path = require('path');
        this.inquirer = require('inquirer');
        this._ = require('lodash');
        this.validator = require('validator');

        this.NEW_LINE = '\n';
        if(/^win/.test(process.platform)) {
            this.NEW_LINE = '\r\n';
        }

        this.options = {};
        this.variables = {};
        this.destinationFile = '';
        this.template = [];
    }

    /**
     * Replace variables in string
     *
     * @param str {string} String to search for variables
     * @returns {string} Expanded string
     */
    ProduceModule.prototype.expandString = function (str) {
        for (var varName in this.variables) {
            if (!this.variables.hasOwnProperty(varName)) {
                continue;
            }
            str = str.replace('{{' + varName + '}}', this.variables[varName]);
        }
        return str;
    };

    /**
     * Replace variables in template file
     */
    ProduceModule.prototype.expandTemplate = function () {
        var _this = this;
        // for each line in template
        this.template.forEach(function (line, lineIndex) {
            // expand template line
            var _expandedLine = _this.expandString(line),
                _unusedMatches = _expandedLine.match(/{{(.*?)}}/g);

            if (_unusedMatches !== null) {
                // display warning about all unused variables
                _unusedMatches.forEach(function(unusedVar){
                    _this.grunt.log.errorlns(
                        'Found unused variable in template: ' + unusedVar + ' on line ' + (lineIndex + 1)
                    );
                });
            }

            _this.template[lineIndex] = _expandedLine;
        });
    };

    /**
     * Validate variables
     */
    ProduceModule.prototype.validate = function () {

        for (var varName in this.variables) {
            if (!this.variables.hasOwnProperty(varName)) {
                continue;
            }

            // check if variable is required
            if((typeof this.variables[varName] === 'undefined' ||
                typeof this.variables[varName] === null ||
                typeof this.variables[varName] === '') &&
                this.options.variables[varName].required === true
            ) {
                throw "Variable [" + varName + "] is required";
            }

            // validate variable
            if(this.grunt.util.kindOf(this.options.variables[varName].validate) === 'function' &&
                !this.options.variables[varName].validate(this.variables[varName], this.validator)){
                throw "Variable [" + varName + "] value is incorrect";
            }
        }
    };

    /**
     * Get array of questions for user
     */
    ProduceModule.prototype.getQuestions = function () {
        var _questions = [],
            i = 0;
        // for each available variable
        for (var varName in this.variables) {
            if (!this.variables.hasOwnProperty(varName)) {
                continue;
            }
            // create new question object
            _questions[i] = {
                name   : varName,
                message: varName,
                default: this.variables[varName]
            };
            i++;
        }
        return _questions;
    };

    /**
     * Create variables to use in template
     * @returns {boolean} Return false if no variables were passed in via CLI
     */
    ProduceModule.prototype._prepareVariables = function () {
        // number of collected variables via CLI
        var _variablesCount = 0;

        // Assign to variables object initial values
        if (typeof this.options.variables['username'] === 'undefined' ){
            this.options.variables['username'] = {
                default: this.options.username
            };
        } else {
            this.options.variables['username'].default = this.options.username;
        }

        if (typeof this.options.variables['email'] === 'undefined' ){
            this.options.variables['email'] = {
                default: this.options.email
            };
        } else {
            this.options.variables['email'].default = this.options.email;
        }

        if (this.grunt.util.kindOf(this.options.variables) === 'object') {
            // for each defined variable collect variable value
            for (var varName in this.options.variables) {
                if (!this.options.variables.hasOwnProperty(varName)) {
                    continue;
                }
                // if variable is passed in via CLI
                if (this.grunt.option(varName)) {
                    // increment counter
                    _variablesCount++;
                }
                // assign variable value
                this.variables[varName] = this.grunt.option(varName) || this.options.variables[varName].default;
            }
        }
        return  (_variablesCount !== 0);
    };

    /**
     * Check if options are correct
     */
    ProduceModule.prototype._checkOptions = function () {
        if (this.grunt.util.kindOf(this.options.fileName) !== 'function' &&
            this.grunt.util.kindOf(this.options.fileName) !== 'string') {
            throw 'fileName is required and must be a string or function';
        }

        if (this.grunt.util.kindOf(this.options.template) !== 'string') {
            throw 'template is required and must be a string';
        }

        if (this.options.fileOverwrite !== 'block' && this.options.fileOverwrite !== 'warning') {
            throw 'options.fileOverwrite must be equal to "block" or "warning"!';
        }
    };

    /**
     * Save destination file as expanded template
     */
    ProduceModule.prototype.saveFile = function () {

        // validate variables
        this.validate();

        // if fileName is a function, run it passing variables as an argument
        if (this.grunt.util.kindOf(this.options.fileName) === 'function') {
            this.options.fileName = this.options.fileName(this.variables);
        }

        // Replace variables in file name
        this.options.fileName = this.expandString(this.options.fileName);
        // Create destination path
        this.destinationFile = this.path.join(this.options.fileName);

        // Replace variables in template file
        this.expandTemplate();

        // Check if destination file exists
        if (this.grunt.file.exists(this.destinationFile)) {
            if (this.options.fileOverwrite === 'block') {
                throw 'Destination file exists! [' + this.destinationFile + ']';
            }
            if (this.options.fileOverwrite === 'warning') {
                this.grunt.log.errorlns('Destination file will be overwriten! [' + this.destinationFile + ']');
            }
        }

        // Save file
        this.grunt.file.write(this.destinationFile, this.template.join(this.NEW_LINE));
        this.grunt.log.writeln('File saved as: ' + this.destinationFile);
    };

    /**
     * Get git config
     *
     * @param configName {string} git config name
     * @returns {string} Git config value
     * @private
     */
    ProduceModule.prototype._getGitConfig = function (configName) {
        return exec('git config ' + configName, {silent:true}).output.replace('\n', '').trim();
    };

    /**
     * Asynchronously prompt user for variables values
     *
     * @param async {object} grunt async object
     * @param callback {function} callback function which is triggered after prompting is complete
     */
    ProduceModule.prototype.promptUserAsync = function(async, callback) {
        var _this = this;

        _this.inquirer.prompt(_this.getQuestions(), function (answers) {
            _this._(answers).forEach(function (answer, varName) {
                // assign user answers to variable
                _this.variables[varName] = answer;
            });
            // finish async mode
            async();
            // run callback function
            callback();
        });
    };

    /**
     * Setup module, collect all required data and load template file
     *
     * @param options {object} Grunt options
     */
    ProduceModule.prototype.setup = function (options) {
        // assign options to class object
        this.options = options;

        // Get GIT config values for username and user e-mail
        // (empty string as default if loading data from git config was unsuccessful)
        this.options.username = this._getGitConfig('user.name') || '';
        this.options.email = this._getGitConfig('user.email') || '';

        // Prepare defined variables and check if prompting for variable values is required
        this.promptUser = !this._prepareVariables();

        this._checkOptions();

        // Check if template file exists
        if (this.grunt.file.exists(this.options.template)) {
            // Read template file
            this.template = this.grunt.file.read(this.options.template).split(this.NEW_LINE);
        } else {
            // set template
            this.template = this.options.template.split('\n');
        }

    };

    return ProduceModule;
})();

module.exports = ProduceModule;
