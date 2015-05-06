'use strict';

var generators      = require('yeoman-generator');
var dir             = require('node-dir');
var fs              = require('fs');
var path            = require('path');
var rimraf          = require('rimraf');

var WC_PREFIX       = 'wc-';
var WC_NAME_KEY     = '{{name}}';
var WC_DIR_MATCH    = '[\\/\\\\]' + WC_PREFIX + WC_NAME_KEY;

var templates = {
  jade:     require.resolve('./templates/template-jade.jade'),
  styl:     require.resolve('./templates/template-stylus.stylus'),
  js:       require.resolve('./templates/template-js.js')
};

var generatedNames = {
  jade: 'template.jade',
  styl: 'style.styl',
  js: 'main.js'
};

var messages = {
  helpLink:           'Use an argument "help" for the help information',

  helpText:           'Help: \n' + 
                      '"yo poly-jadestyl add your-component-name": \ncreating a new ' + 
                      'WebComponent named wc-your-component-name in the current directory\n\n' + 
                      '"yo poly-jadestyl remove your-component-name": \nsearching a WebComponent named wc-your-component-name ' + 
                      'in the current directory and its subdirs and removing it\n\n',

  mustHaveDash:       'WebComponent name must contains "dash" (-) symbol',

  createSuccess:      'WebComponent created',

  removeSuccess:      'WebComponent removed',

  alreadyExist:       'WebComponent with the same name already exists. ' + 
                      'Remove it explicity with "-r" command and try create again',

  notFound:           'WebComponent with the name not found',

  tooManyMatches:     'There are too many components in this folder with the same name. Check it manually before removing'
};


var Generator = generators.Base.extend({

  constructor: function () {
    generators.Base.apply(this, arguments);

    this.argument('method', { type: String, required: true });
    this.argument('name',   { type: String, required: false });
  },

  run: function() {
    var fields = {
      method: this.method,
      name: this.name
    };

    if (checkArguments(fields)) {
      switch (this.method) {
        case 'add':
          addComponent(this.name);
          break;

        case 'rem':
          removeComponent(this.name);
          break;
      }
    }
  }
});

var checkArguments = function (args) {
  if (!args.method || !args.name) {
    console.log(messages.helpText);
    return false;
  }

  if (!hasDash(args.name)) {
    console.log(messages.mustHaveDash);
    return false;
  }

  return true;
};

var hasDash = function (value) {
  return value.indexOf('-') !== -1;
}

var addComponent = function (name) {
  if (name.indexOf(WC_PREFIX) === 0) {
    name = name.replace(WC_PREFIX, '');
  }

  var componentDir = WC_PREFIX + name;

  if (fs.existsSync(componentDir)){
    console.log(messages.alreadyExist);
    return;
  }

  fs.mkdirSync(componentDir);

  var jadeSource = fs.readFileSync(templates.jade, 'utf8');
  var jadeResult = jadeSource.replace(WC_NAME_KEY, name);
  fs.writeFileSync(path.join(componentDir, generatedNames.jade), jadeResult);

  var stylContent = fs.readFileSync(templates.styl, 'utf8');
  fs.writeFileSync(path.join(componentDir, generatedNames.styl), stylContent);

  var jsSource = fs.readFileSync(templates.js, 'utf8');
  var jsResult = jsSource.replace(WC_NAME_KEY, name);
  fs.writeFileSync(path.join(componentDir, generatedNames.js), jsResult);

  console.log(messages.createSuccess);
};

var removeComponent = function (name) {
  if (name.indexOf(WC_PREFIX) === 0) {
    name = name.replace(WC_PREFIX, '');
  }

  var baseDir = process.cwd();

  dir.subdirs(baseDir, function(err, dirs) {
    if (err) throw err;

    var matchTemplate = new RegExp(WC_DIR_MATCH.replace(WC_NAME_KEY, name));
    var matches = dirs.filter(function (directory) {
      return matchTemplate.test(directory);
    });

    switch (matches.length) {
      // success
      case 1: 
        rimraf.sync(matches[0]);
        console.log(messages.removeSuccess);
        break;

      // errors
      case 0:
        console.log(messages.notFound);
        break;

      default:
        console.log(messages.tooManyMatches);
        break;
    }
  });
};

module.exports = Generator;