/**
 * Nodeunit functional tests.  Requires internet connection to validate phantom
 * functions correctly.
 */

var childProcess = require('child_process')
var fs = require('fs')
var path = require('path')
var phantomjs = require('../')


exports.testDownload = function (test) {
  test.expect(1)
  test.ok(fs.existsSync(phantomjs.path), 'Binary file should have been downloaded')
  test.done()
}


exports.testPhantomExecutesTestScript = function (test) {
  test.expect(1)

  var childArgs = [
    path.join(__dirname, 'loadspeed.js'),
    'http://www.google.com/'
  ]

  childProcess.execFile(phantomjs.path, childArgs, function (err, stdout, stderr) {
    var value = (stdout.indexOf('msec') !== -1)
    test.ok(value, 'Test script should have executed and returned run time')
    test.done()
  })
}


exports.testPhantomExitCode = function (test) {
  test.expect(1)
  childProcess.execFile(phantomjs.path, [path.join(__dirname, 'exit.js')], function (err, stdout, stderr) {
    test.equals(err.code, 123, 'Exit code should be returned from phantom script')
    test.done()
  })
}


exports.testBinFile = function (test) {
  test.expect(1)

  var binPath = phantomjs.path;

  childProcess.execFile(binPath, ['--version'], function (err, stdout, stderr) {
    test.equal(phantomjs.version, stdout.trim(), 'Version should be match')
    test.done()
  })
}
