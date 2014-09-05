'use strict';

var bin = require('./');
var logSymbols = require('log-symbols');
var path = require('path');

/**
 * Install binary and check whether it works
 * If the test fails, try to build it
 */

bin.run(['--version'], function (err) {
  if (err) {
    return console.log(logSymbols.error, err);
  }

  var location = path.relative(path.join(__dirname, '../'), bin.path());
  console.log(logSymbols.success + ' Done! Phantomjs binary available at ' + location);
});
