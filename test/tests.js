/**
 * Nodeunit functional tests.  Requires internet connection to validate slimer
 * functions correctly.
 */

var childProcess = require('child_process')
var fs = require('fs')
var path = require('path')
var slimerjs = require('../lib/slimerjs')


exports.testDownload = function (test) {
  test.expect(1)
  test.ok(fs.existsSync(slimerjs.path), 'Binary file should have been downloaded')
  test.done()
}


exports.testSlimerExecutesTestScript = function (test) {
  test.expect(2)

  var childArgs = [
    // run SlimerJS using virtual frame buffer (xvfb)
    '--auto-servernum',
    '--server-num=1',
    slimerjs.path,
    // SlimerJS arguments
    path.join(__dirname, 'loadspeed.js'),
    'http://www.google.com/'
  ]

  childProcess.execFile('xvfb-run', childArgs, function (err, stdout, stderr) {
    var value = (stdout.indexOf('msec') !== -1)
    test.ok(err === null, 'Test script should complete without errors')
    test.ok(value, 'Test script should have executed and returned run time')
    test.done()
  })
}


exports.testBinFile = function (test) {
  test.expect(1)

  var binPath = process.platform === 'win32' ? 
      path.join(__dirname, '..', 'lib', 'slimer', 'slimerjs.exe') :
      path.join(__dirname, '..', 'bin', 'slimerjs')

  childProcess.execFile(binPath, ['--version'], function (err, stdout, stderr) {
    test.ok(stdout.trim().indexOf(slimerjs.version) >= -1, 'Version should be match')
    test.done()
  })
}


exports.testCleanPath = function (test) {
  test.expect(5)
  test.equal('/Users/dan/bin', slimerjs.cleanPath('/Users/dan/bin:./bin'))
  test.equal('/Users/dan/bin:/usr/bin', slimerjs.cleanPath('/Users/dan/bin:./bin:/usr/bin'))
  test.equal('/usr/bin', slimerjs.cleanPath('./bin:/usr/bin'))
  test.equal('', slimerjs.cleanPath('./bin'))
  test.equal('/Work/bin:/usr/bin', slimerjs.cleanPath('/Work/bin:/Work/slimerjs/node_modules/.bin:/usr/bin'))
  test.done()
}
