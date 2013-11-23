/**
 * Nodeunit functional tests.  Requires internet connection to validate phantom
 * functions correctly.
 */

var childProcess = require('child_process')
var fs = require('fs')
var path = require('path')
var phantomjs = require('../lib/phantomjs')


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

exports.testBinFile = function (test) {
  test.expect(1)

  var binPath = process.platform === 'win32' ?
      path.join(__dirname, '..', 'lib', 'phantom', 'phantomjs.exe') :
      path.join(__dirname, '..', 'lib', 'phantom', 'bin', 'phantomjs-' + process.platform)

  childProcess.execFile(binPath, ['--version'], function (err, stdout, stderr) {
    test.equal(phantomjs.version, stdout.trim(), 'Version should be match')
    test.done()
  })
}


exports.testCleanPath = function (test) {
  test.expect(5)
  test.equal('/Users/dan/bin', phantomjs.cleanPath('/Users/dan/bin:./bin'))
  test.equal('/Users/dan/bin:/usr/bin', phantomjs.cleanPath('/Users/dan/bin:./bin:/usr/bin'))
  test.equal('/usr/bin', phantomjs.cleanPath('./bin:/usr/bin'))
  test.equal('', phantomjs.cleanPath('./bin'))
  test.equal('/Work/bin:/usr/bin', phantomjs.cleanPath('/Work/bin:/Work/phantomjs/node_modules/.bin:/usr/bin'))
  test.done()
}

exports.testNewBinaryDownload = function (test) {
  test.expect(2)

  var binaryJSONPath = path.join(__dirname, '../lib/binary.json')
  var originalBinaryJSON = fs.readFileSync(binaryJSONPath, 'utf8')

  // Remove current platform's phantomjs binary and
  // put a mock binary.json which has a reference to another platform's binary
  fs.unlinkSync(path.join(__dirname, '../lib', JSON.parse(originalBinaryJSON)[process.platform]))
  fs.writeFileSync(binaryJSONPath, JSON.stringify({ platform: 'phantom/bin/phantom-platform' }))

  var phantomProcess = childProcess.spawn('node', ['bin/phantomjs'])

  phantomProcess.stdout.setEncoding('utf8')
  phantomProcess.stdout.on('data', function (data) {
    if (data.indexOf('phantomjs>') !== -1) {
      test.ok(true, 'New phantomjs binary is runnable on the current platform')
      phantomProcess.kill()
      test.ok(JSON.parse(fs.readFileSync(binaryJSONPath, 'utf8'))[process.platform], 'New phantom binary added to binary.json')

      // Restore the original binary.json
      fs.writeFileSync(binaryJSONPath, originalBinaryJSON)
      test.done()
    }
  })
}
