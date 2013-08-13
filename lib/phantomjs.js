// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Helpers made available via require('phantomjs') once package is
 * installed.
 */

var path = require('path')
var which = require('which')


/**
 * Where the phantom binary can be found.
 * @type {string}
 */
try {
  exports.path = require('./location').location
} catch(e) {
  // Must be running inside install script.
  exports.path = null
}


/**
 * The version of phantomjs installed by this package.
 * @type {number}
 */
exports.version = '1.9.1'


/**
 * Returns a clean path that helps avoid `which` finding bin files installed
 * by NPM for this repo.
 * @param {string} path
 * @return {string}
 */
exports.cleanPath = function (path) {
  return path
      .replace(/:[^:]*node_modules[^:]*/g, '')
      .replace(/(^|:)\.\/bin(\:|$)/g, ':')
      .replace(/^:+/, '')
      .replace(/:+$/, '')
}
