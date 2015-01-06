# grunt-create

> Automating the process of creating project files.

This module will help you use the Grunt CLI as a tool to create project files from templates. Especially it is handy when your project is made up of multiple source files on a recurring scheme (eg. MVC applications).

After the implementation of the module to the project, the final effect should be like a Artisan tool from Laravel Framework. Although it depends on you how files will be created and what will they contain.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-create --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-create');
```

## The "create" task

### Overview
In your project's Gruntfile, add a section named `create` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  create: {
    target_name: {
        options: {
          // options
        }
     },
  },
});
```

This will allow you to use grunt cli to run this task for selected target. Name of the target is up to you however it should be short and unique.

For above example to run `target_name` type in console/terminal:

```shell
grunt create:target_name
```

**Note:** You can't run `grunt create` task without providing a target name.

### Options

#### options.template 
Type: `String`
Default value: `''`
*Required*

Path to template file for current target. You can use variables in template. For more information about variables and its usage go to variables section of this document.

----------

#### options.fileName
Type: `String` or `Function`
Default value: `{{name}}.ts`
*Required*

Path to destination file. You can use variables in a string to customize destination path and/or file name each time you run this target. Remember that variables must be declared in `options.parameters` first.

For more advanced usage you can use function instead of string. Function must return a string with valid file path. Function takes one argument with object containing all available variables. For more information about variables and its usage go to variables section of this document.

For example:
```js
fileName: function(vars) {
	return 'app/' + vars.name + '.js';
},

```

----------

#### options.variables
Type: `Object`
Default value: `{name: 'MyFile'}`

Object containing custom variables than can be passed into module while creating new file from template. 

Each object item contains variable name and its default value, ie:
```js
options.variables: {
	my_var: 'val'
}
```
where `my_var` is custom variable name and `'val'` is its default value which will be used if this variable will be omitted.

Those variables can be used in template file or in destination file path. For more information go to variables section of this document.

### Variables

You can use variables to modify template file and/or destination file name. Except default variables, each new has to be defined first in `options.parameters` array. To use variable place it within double brackets tag anywhere in your template file or destination file path, ie.:

`{{variable_name}}`

#### Passing data to variables

To pass value to defined variable while running `grunt create:target` task use following format:
```shell
grunt create:target --variable_name="variable value"
```

This way you can pass value to multiple variables, ie:
```shell
--var1=value1 --var2=value2
```

#### Default variables

There are two default variables: `username` and `email`

By default, module will try to get username and user email from git config and store its values in default variables. Usage of default variables are the same as any other defined by you.

### Usage Example

In this example, there is a `jqplugin` target defined. Its purpose is creating new jQuery plugin from template using few custom variables and default ones for author name and author e-mail. It is assumed that git is installed on system and git `user.name` and `user.email` are set to:
```
user.name = John Doe
user.email = jdoe@example.com
```

#### Inside grunt config

```js
grunt.initConfig({
  create: {
    jqplugin: {
        options: {
          template: 'templates/jq_plugin.tpl',
          variables:   {
              name: 'MyPlugin',
              description: 'Default description'
          },
          fileName: 'scripts/{{name}}.coffee'
        }
     },
  },
});
```

#### Inside jq_plugin.tpl

```coffee
#
# {{description}}
#
# @author   {{username}} ({{email}})
do ($ = jQuery, window, document) ->

	# Create the defaults once
	pluginName = "{{name}}"
	defaults =
		property: "value"

	# The actual plugin constructor
	class Plugin
		constructor: (@element, options) ->
			@settings = $.extend {}, defaults, options
			@_defaults = defaults
			@_name = pluginName
			@init()

		init: ->
			# Place initialization logic here
			console.log "xD"
			
		yourOtherFunction: ->
			# some logic

	$.fn[pluginName] = (options) ->
		@each ->
			unless $.data @, "plugin_#{pluginName}"
				$.data @, "plugin_#{pluginName}", new Plugin @, options
```

#### Running

To create new plugin type in console/terminal:

```shell
grunt ceate:jqplugin --name=BestPluginEver --description="This is my best plugin"
```

After executing above command, there should be new file:
`scripts/BestPluginEver.coffee`

with content of `templates/jq_plugin.tpl` and variables changed to

```coffee
#
# This is my best plugin
#
# @author   John Doe (jdoe@example.com)
do ($ = jQuery, window, document) ->

	# Create the defaults once
	pluginName = "BestPluginEver"
...
```

You can also override default variables:
```shell
grunt ceate:jqplugin --name=BestPluginEver --description="A Plugin" --username="Bugs Bunny" --email=bbunny@example.com
```

in this case output file will contain:

```coffee
#
# A Plugin
#
# @author   Bugs Bunny (bbunny@example.com)
do ($ = jQuery, window, document) ->

	# Create the defaults once
	pluginName = "BestPluginEver"
...
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
