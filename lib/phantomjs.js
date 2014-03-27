// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Helpers made available via require('phantomjs') once package is
 * installed.
 */

var fs = require('fs')
var path = require('path')
var which = require('which')
var spawn = require('child_process').spawn

/**
 * Where the phantom binary can be found.
 * @type {string}
 */
try {
  exports.path = path.resolve(__dirname, require('./location').location)
} catch(e) {
  // Must be running inside install script.
  exports.path = null
}


/**
 * The version of phantomjs installed by this package.
 * @type {number}
 */
exports.version = '1.9.7'


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


// Make sure the binary is executable.  For some reason doing this inside
// install does not work correctly, likely due to some NPM step.
if (exports.path) {
  try {
    // avoid touching the binary if it's already got the correct permissions
    var st = fs.statSync(exports.path);
    var mode = st.mode | 0555;
    if (mode !== st.mode) {
      fs.chmodSync(exports.path, mode);
    }
  } catch (e) {
    // Just ignore error if we don't have permission.
    // We did our best. Likely because phantomjs was already installed.
  }
}

exports.run = function (args, spawnOptions) {
  var binPath = exports.path;

  // For Node 0.6 compatibility, pipe the streams manually, instead of using
  // `{ stdio: 'inherit' }`.
  var cp = spawn(binPath, args, spawnOptions);
  cp.stdout.pipe(process.stdout);
  cp.stderr.pipe(process.stderr);
  process.stdin.pipe(cp.stdin);

  cp.on('error', function (err) {
    console.error('Error executing phantom at', binPath);
    console.error(err.stack);
  });

  process.on('SIGTERM', function() {
    cp.kill('SIGTERM');
    process.exit(1);
  });

  return cp;
};

var PhantomJsServer = function (childProcess) {
  this.childProcess = childProcess;
};

PhantomJsServer.prototype.stop = function (callback) {
  if (this.childProcess != null) {
    if (callback) {
      this.childProcess.on('exit', function (code) {
        callback(code);
      });
    }
    this.childProcess.kill();
  }
};

PhantomJsServer.prototype.address = function () {
  return 'http://127.0.0.1:4444/wd/hub';
};

exports.start = function (callback) {
  var buffer = '';
  var serverStarted = false;
  var startedRegex = /running on port 4444/;
  var cp = exports.run(['--webdriver=4444', '--ignore-ssl-errors=true']);
  if (callback) {
    var waitForServerRunning = function (data) {
      // TODO: if .removeListener is working correctly, this 'if' is unnecessary
      if (!serverStarted && buffer.length < 512) {
        buffer += data;
        if (startedRegex.test(buffer)) {
          serverStarted = true;
          cp.removeListener('data', waitForServerRunning);
          callback();
        }
      }
    };
    cp.stdout.on('data', waitForServerRunning);
  }
  return new PhantomJsServer(cp);
};
