/*
 * ProduceModule
 * https://github.com/mkatanski/grunt-produce
 *
 * Copyright (c) 2015 Michał Katański
 * Licensed under the MIT license.
 */

var ProduceModule = (function () {
  'use strict';

  var path = require('path'),
      inquirer = require('inquirer'),
      _ = require('underscore'),
      yaml = require('js-yaml'),
      validator = require('validator'),
      fs = require('fs'),
      shell = require('shelljs');

  /**
   * Create ProduceModule instance
   *
   * @param grunt {Class} Grunt class
   * @constructor
   */
  function ProduceModule(grunt) {
    this.grunt = grunt;
    this.template = {};
    this.locals = {};
    this.destinationFile = '';

    this.template.fileOverwrite = undefined;
    this.template.templateName = undefined;
  }

  /**
   * Validate locals
   */
  ProduceModule.prototype.validate = function () {
    _.each(this.locals, function (value, varName) {
      var _variable = this.template.variables[varName];
      console.log(varName + ' = ' + value);
      // check if non-function variable is required
      if (!_.isFunction(value)) {
        if ((_.isNaN(value) || value.trim() === '') && _variable.required === true) {
          throw 'Variable [' + varName + '] is required';
        }
      }

      // validate variable
      if (_.isFunction(_variable.validate) && !_variable.validate(value, validator)) {
        throw 'Variable [' + varName + '] value is incorrect';
      }
    }, this);
  };

  /**
   * Get array of questions for user
   */
  ProduceModule.prototype.getQuestions = function () {
    var _questions = [];
    // for each available variable
    _.each(this.locals, function (value, varName) {
      // create new question object and append to list if value is not a function
      if (!_.isFunction(value)) {
        _questions.push({
          name:    varName,
          message: varName,
          default: value
        });
      }
    }, this);
    return _questions;
  };

  /**
   * Create locals to use in template
   * @returns {boolean} Return false if no locals were passed in via CLI
   */
  ProduceModule.prototype._prepareVariables = function () {
    // number of collected locals via CLI
    var _variablesCount = 0,
        _initial;

    // Assign to locals object initial values
    _initial = {value: this.template.username};
    if (_.isUndefined(this.template.variables.username)) {
      this.template.variables.username = _initial;
    } else {
      this.template.variables.username.value = _initial.value;
    }

    _initial = {value: this.template.email};
    if (_.isUndefined(this.template.variables.email)) {
      this.template.variables.email = _initial;
    } else {
      this.template.variables.email.value = _initial.value;
    }

    if (_.isObject(this.template.variables)) {
      // for each defined variable collect variable value
      _.each(this.template.variables, function (variable, varName) {
        // check if variable value is a function
        if (_.isFunction(variable.value)) {
          this.locals[varName] = variable.value;
        } else {
          // if variable is passed in via CLI
          if (this.grunt.option(varName)) {
            // increment counter
            _variablesCount++;
          }
          // assign variable value
          this.locals[varName] = this.grunt.option(varName) || variable.value;
        }
      }, this);
    }
    return (_variablesCount !== 0);
  };

  /**
   * Check if template are correct
   */
  ProduceModule.prototype._checkOptions = function () {
    if (!_.isFunction(this.template.fileName) &&
          !_.isString(this.template.fileName)) {
      throw 'fileName is required and must be a string or function';
    }

    if (!_.isString(this.template.template)) {
      throw 'template is required and must be a string';
    }

    if (this.template.fileOverwrite !== 'block' &&
        this.template.fileOverwrite !== 'warning') {
      throw 'options.fileOverwrite must be equal to "block" or "warning"!';
    }
  };

  /**
   * Save destination file as expanded template
   */
  ProduceModule.prototype.saveFile = function () {
    // validate locals
    this.validate();

    // if fileName is a function, run it passing locals as an argument
    if (_.isFunction(this.template.fileName)) {
      this.template.fileName = this.template.fileName(this.locals);
    }

    // Replace locals in file name
    this.template.fileName = _.template(this.template.fileName)(this.locals);
    // Create destination path
    this.destinationFile = path.join(this.template.fileName);

    // Replace locals in template file
    this.template.template = _.template(this.template.template)(this.locals);

    // Check if destination file exists
    if (this.grunt.file.exists(this.destinationFile)) {
      if (this.template.fileOverwrite === 'block') {
        throw 'Destination file exists! [' + this.destinationFile + ']';
      }
      if (this.template.fileOverwrite === 'warning') {
        this.grunt.log.errorlns('Destination file will be overwriten! [' +
        this.destinationFile + ']');
      }
    }

    var _templateName = this.template.templateName || this.template.templateFile,
        _description = this.template.description || '';

    console.log('\n\nSaving new file [' + this.destinationFile + '] based on:\n' +
        _templateName + ': ' + _description + '\n'
    );

    // Save file
    this.grunt.file.write(this.destinationFile, this.template.template);
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
    return shell.exec('git config ' + configName,
        {silent: true}).output.replace('\n', '').trim();
  };

  /**
   * Asynchronously prompt user for locals values
   *
   * @param async {function} grunt async object
   * @param callback {function} callback function which is triggered
   * after prompting is complete
   */
  ProduceModule.prototype.promptUserAsync = function (async, callback) {
    var _this = this;
    inquirer.prompt(this.getQuestions(), function (answers) {
      _.each(answers, function (answer, varName) {
        // assign user answers to variable
        _this.locals[varName] = answer;
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
   * @param options {object} Module options
   */
  ProduceModule.prototype.setup = function (options) {
    // load template from YAML file
    /*jslint node: true, stupid: true */
    this.template = yaml.load(fs.readFileSync(options.templateFile, 'utf8'));
    this.template.templateFile = options.templateFile;

    // Get GIT config values for username and user e-mail
    // (empty string as default if loading data from git config was
    // unsuccessful)
    this.template.username = this._getGitConfig('user.name') || '';
    this.template.email = this._getGitConfig('user.email') || '';

    // Prepare defined locals and check if prompting for variable
    // values is required
    this.promptUser = !this._prepareVariables();

    this._checkOptions();

    // Check if template file exists
    if (this.grunt.file.exists(this.template.template)) {
      // Read template file
      this.template.template = this.grunt.file.read(this.template.template);
    }
  };

  return ProduceModule;
}());

module.exports = ProduceModule;
