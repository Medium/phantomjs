/**
 * @fileoverview Package-private helpers for the installer.
 */

'use strict'

var cp = require('child_process')
var fs = require('fs-extra')
var hasha = require('hasha')
var helper = require('./phantomjs')
var kew = require('kew')
var path = require('path')

var DEFAULT_CDN = 'https://github.com/Medium/phantomjs/releases/download/v2.5.0-beta'
var libPath = __dirname

/**
 * Given a lib/location file of a PhantomJS previously installed with NPM,
 * is there a valid PhantomJS binary at this lib/location.
 * @return {Promise<string>} resolved location of phantomjs binary on success
 */
function findValidPhantomJsBinary(libPath) {
  return kew.fcall(function () {
    var libModule = require(libPath)
    if (libModule.location &&
        getTargetPlatform() == libModule.platform &&
        getTargetArch() == libModule.arch) {
      var resolvedLocation = path.resolve(path.dirname(libPath), libModule.location)
      if (fs.statSync(resolvedLocation)) {
        return checkPhantomjsVersion(resolvedLocation).then(function (matches) {
          if (matches) {
            return kew.resolve(resolvedLocation)
          }
        })
      }
    }
    return false
  }).fail(function () {
    return false
  })
}

/**
 * Check to make sure a given binary is the right version.
 * @return {kew.Promise.<boolean>}
 */
function checkPhantomjsVersion(phantomPath) {
  console.log('Found PhantomJS at', phantomPath, '...verifying')
  return kew.nfcall(cp.execFile, phantomPath, ['--version']).then(function (stdout) {
    var version = stdout.trim()
    if (helper.version == version) {
      return true
    } else {
      console.log('PhantomJS detected, but wrong version', stdout.trim(), '@', phantomPath + '.')
      return false
    }
  }).fail(function (err) {
    console.error('Error verifying phantomjs, continuing', err)
    return false
  })
}

/**
 * Writes the location file with location and platform/arch metadata about the
 * binary.
 */
function writeLocationFile(location) {
  console.log('Writing location.js file')
  if (getTargetPlatform() === 'win32') {
    location = location.replace(/\\/g, '\\\\')
  }

  var platform = getTargetPlatform()
  var arch = getTargetArch()

  var contents = 'module.exports.location = "' + location + '"\n'

  if (/^[a-zA-Z0-9]*$/.test(platform) && /^[a-zA-Z0-9]*$/.test(arch)) {
    contents +=
        'module.exports.platform = "' + getTargetPlatform() + '"\n' +
        'module.exports.arch = "' + getTargetArch() + '"\n'
  }

  fs.writeFileSync(path.join(libPath, 'location.js'), contents)
}

/**
 * @return {?{url: string, checksum: string}} Get the download URL and expected
 *     SHA-256 checksum for phantomjs.  May return null if no download url exists.
 */
function getDownloadSpec() {
  var cdnUrl = process.env.npm_config_phantomjs_cdnurl ||
      process.env.PHANTOMJS_CDNURL ||
      DEFAULT_CDN
  var downloadUrl = cdnUrl + '/phantomjs-' + helper.version + '-'
  var checksum = ''

  var platform = getTargetPlatform()
  var arch = getTargetArch()
  if (platform === 'linux' && arch === 'x64') {
    downloadUrl += 'linux-x86_64.tar.gz'
    checksum = 'b478bb44e7a77468683a615bda082716d76e99dc17ebbc005d31d06b6715429e'
  } else if (platform === 'linux' && arch == 'ia32') {
    downloadUrl += 'linux-i686.tar.bz2'
    checksum = '80e03cfeb22cc4dfe4e73b68ab81c9fdd7c78968cfd5358e6af33960464f15e3'
  } else if (platform === 'darwin') {
    downloadUrl += 'macosx.zip'
    checksum = '8183eaaac1bf73edbe2414870ffa4b6262b42ab97d3f252cee073746ca272acc'
  } else if (platform === 'win32') {
    downloadUrl += 'windows.zip'
    checksum = '3e0d684e7564862cbf43e38b9e29dd087052de19d76c525d6f08c37d211a4381'
  } else {
    return null
  }
  return {url: downloadUrl, checksum: checksum}
}

/**
 * Check to make sure that the file matches the checksum.
 * @param {string} fileName
 * @param {string} checksum
 * @return {Promise.<boolean>}
 */
function verifyChecksum(fileName, checksum) {
  return kew.resolve(hasha.fromFile(fileName, {algorithm: 'sha256'})).then(function (hash) {
    var result = checksum == hash
    if (result) {
      console.log('Verified checksum of previously downloaded file')
    } else {
      console.log('Checksum did not match')
    }
    return result
  }).fail(function (err) {
    console.error('Failed to verify checksum: ', err)
    return false
  })
}

/**
 * @return {string}
 */
function getTargetPlatform() {
  return process.env.PHANTOMJS_PLATFORM || process.platform
}

/**
 * @return {string}
 */
function getTargetArch() {
  return process.env.PHANTOMJS_ARCH || process.arch
}

module.exports = {
  checkPhantomjsVersion: checkPhantomjsVersion,
  getDownloadSpec: getDownloadSpec,
  getTargetPlatform: getTargetPlatform,
  getTargetArch: getTargetArch,
  findValidPhantomJsBinary: findValidPhantomJsBinary,
  verifyChecksum: verifyChecksum,
  writeLocationFile: writeLocationFile
}
