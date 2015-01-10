/*
 * grunt-produce
 * https://github.com/mkatanski/grunt-produce
 *
 * Copyright (c) 2015 Michał Katański
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Sample configuration
    produce: {
      jqplugin: {
        options: {
          template: 'templates/jq_template.tpl',
          variables: {
            name: 'MyPlugin',
            description: 'Default description'
          },
          fileName: 'tmp/test/{{name}}.coffee'
        }
      },
      another: {
        options: {
          template: 'templates/jq_template.tpl',
          variables: {
            name: 'MyPlugin',
            description: 'Default description'
          },
          fileName: function(vars){
            return 'tmp/another/' + vars.name + '.coffee';
          }
        }
      }
    },

    changelog: {
      options: {
      }
    }

  });

  // Actually load this plugins task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-conventional-changelog');

};
