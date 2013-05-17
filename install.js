// Copyright 2012 The Obvious Corporation.

/*
 * This simply fetches the right version of phantom for the current platform.
 */

'use strict'

var cp = require('child_process')
var fs = require('fs')
var http = require('http')
var kew = require('kew')
var path = require('path')
var url = require('url')
var rimraf = require('rimraf').sync
var AdmZip = require('adm-zip')
var helper = require('./lib/phantomjs')
var ncp = require('ncp')
var npmconf = require('npmconf')

var libPath = path.join(__dirname, 'lib', 'phantom')
var downloadUrl = 'http://phantomjs.googlecode.com/files/phantomjs-' + helper.version + '-'

if (process.platform === 'linux' && process.arch === 'x64') {
  downloadUrl += 'linux-x86_64.tar.bz2'
} else if (process.platform === 'linux') {
  downloadUrl += 'linux-i686.tar.bz2'
} else if (process.platform === 'darwin') {
  downloadUrl += 'macosx.zip'
} else if (process.platform === 'win32') {
  downloadUrl += 'windows.zip'
} else {
  console.log('Unexpected platform or architecture:', process.platform, process.arch)
  process.exit(1)
}

var fileName = downloadUrl.split('/').pop()


npmconf.load(function(err, conf) {
  if (err) {
    console.log('Error loading npm config')
    console.error(err)
    process.exit(1)
    return
  }

  var tmpPath = path.join(conf.get('tmp'), 'phantomjs')
  var downloadedFile = path.join(tmpPath, fileName)

  var promise= kew.resolve(true)

  // Start the install.
  if (!fs.existsSync(downloadedFile)) {
    promise = promise.then(function () {
      rimraf(tmpPath)
      mkdir(downloadedFile)
      console.log('Downlaoading', downloadUrl)
      console.log('Saving to', downloadedFile)
      return requestBinary(getRequestOptions(conf.get('proxy')), downloadedFile)
    })

  } else {
    console.log('Download already available at', downloadedFile)
  }

  promise.then(function () {
    return extractDownload(downloadedFile, tmpPath)
  })
  .then(function () {
    return copyIntoPlace(tmpPath, libPath)
  })
  .then(function () {
    return fixFilePermissions()
  })
  .then(function () {
    console.log('Done. Phantomjs binary available at', helper.path)
  })
  .fail(function (err) {
    console.error('Phantom installation failed', err.stack)
    process.exit(1)
  })
})


function getRequestOptions(proxyUrl) {
  if (proxyUrl) {
    var options = url.parse(proxyUrl)
    options.path = downloadUrl
    options.headers = { Host: url.parse(downloadUrl).host }
    // turn basic authorization into proxy-authorization
    if (options.auth) {
      options.headers['Proxy-Authorization'] = 'Basic ' + new Buffer(options.auth).toString('base64')
      delete options.auth
    }

    return options
  } else {
    return url.parse(downloadUrl)
  }
}


function requestBinary(requestOptions, filePath) {
  var deferred = kew.defer()

  var count = 0
  var notifiedCount = 0
  var outFile = fs.openSync(filePath, 'w')

  var client = http.get(requestOptions, function (response) {
    var status = response.statusCode
    console.log('Receiving...')

    if (status === 200) {
      response.addListener('data',   function (data) {
        fs.writeSync(outFile, data, 0, data.length, null)
        count += data.length
        if ((count - notifiedCount) > 800000) {
          console.log('Received ' + Math.floor(count / 1024) + 'K...')
          notifiedCount = count
        }
      })

      response.addListener('end',   function () {
        console.log('Received ' + Math.floor(count / 1024) + 'K total.')
        fs.closeSync(outFile)
        deferred.resolve(true)
      })

    } else {
      client.abort()
      deferred.reject('Error with http request: ' + util.inspect(response.headers))
    }
  })

  return deferred.promise
}


function extractDownload(filePath, tmpPath) {
  var deferred = kew.defer()
  var options = {cwd: tmpPath}

  rimraf(libPath)

  if (filePath.substr(-4) === '.zip') {
    console.log('Extracting zip contents')

    try {
      var zip = new AdmZip(filePath)
      zip.extractAllTo(path.dirname(filePath), true)
      deferred.resolve(true)
    } catch (e) {
      deferred.reject('Error extracting archive ' + err.stack)
    }

  } else {
    console.log('Extracting tar contents (via spawned process)')
    cp.execFile('tar', ['jxf', filePath], options, function (err, stdout, stderr) {
      if (err) {
        deferred.reject('Error extracting archive ' + err.stack)
      } else {
        deferred.resolve(true)
      }
    })
  }
  return deferred.promise
}


function copyIntoPlace(tmpPath, targetPath) {
  var deferred = kew.defer()
  // Look for the extracted directory, so we can rename it.
  var files = fs.readdirSync(tmpPath)
  for (var i = 0; i < files.length; i++) {
    var file = path.join(tmpPath, files[i])
    if (fs.statSync(file).isDirectory()) {
      console.log('Renaming extracted folder', file, '->', targetPath)
      ncp(file, targetPath, deferred.makeNodeResolver())
      break
    }
  }
  return deferred.promise
}



function fixFilePermissions() {
  // Check that the binary is user-executable and fix it if it isn't (problems with unzip library)
  if (process.platform != 'win32') {
    var stat = fs.statSync(helper.path)
    // 64 == 0100 (no octal literal in strict mode)
    if (!(stat.mode & 64)) {
      console.log('Fixing file permissions')
      fs.chmodSync(helper.path, '755')
    }
  }
}


function mkdir(name) {
  var dir = path.dirname(name)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}
