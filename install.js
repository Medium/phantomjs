// Copyright 2012 The Obvious Corporation.

/*
 * This simply fetches the right version of phantom for the current platform.
 */

'use strict';

var cp = require('child_process')
var fs = require('fs')
var http = require('http')
var path = require('path')
var url = require('url')

var DOWNLOAD_DIR = path.join(__dirname, 'lib')

var downloadUrl
  , fileName

if (process.platform == 'linux' && process.arch == 'x64') {
  downloadUrl = 'http://phantomjs.googlecode.com/files/phantomjs-1.6.1-linux-x86_64-dynamic.tar.bz2'

} else if (process.platform == 'linux') {
  downloadUrl = 'http://phantomjs.googlecode.com/files/phantomjs-1.6.1-linux-i686-dynamic.tar.bz2'

} else if (process.platform == 'darwin') {
  downloadUrl = 'http://phantomjs.googlecode.com/files/phantomjs-1.6.1-macosx-static.zip'

} else {
  console.log('Unexpected platform or architecture:', process.platform, process.arch)
  process.exit(1)
}

var fileName = downloadUrl.split('/').pop()
var downloadedFile = path.join(DOWNLOAD_DIR, fileName)

fetchIt()

function mkdir(name) {
  var dir = path.dirname(name)
  if (!path.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function fetchIt() {
  mkdir(downloadedFile)

  var client = http.get(url.parse(downloadUrl), onResponse)
  var outFile = fs.openSync(downloadedFile, 'w')
  var notifiedCount = 0
  var count = 0

  console.log('Requesting ' + downloadedFile)

  function onResponse(response) {
  	var status = response.statusCode
    console.log('Receiving...')

  	if (status === 200) {
      response.addListener('data', onData)
      response.addListener('end', onEnd)
  	} else {
      console.log('Error with http request', response.headers)
      httpRequest.abort()
      process.exit(1)
    }
  }

  function onData(data) {
    fs.writeSync(outFile, data, 0, data.length, null)
    count += data.length
    if ((count - notifiedCount) > 800000) {
      console.log('Recieved ' + Math.floor(count / 1024) + 'K...')
      notifiedCount = count
    }
  }

  function onEnd() {
    console.log('Recieved ' + Math.floor(count / 1024) + 'K total.')
    fs.closeSync(outFile)
    extractIt()
  }
}

function extractIt() {
  var options = {
    cwd: DOWNLOAD_DIR
  }

  if (fileName.substr(-4) == '.zip') {
    console.log('Extracting zip contents')
    cp.execFile('unzip', [downloadedFile], options, finishIt)
  } else {
    console.log('Extracting tar contents')
    cp.execFile('tar', ['jxf', downloadedFile], options, finishIt)
  }
}

function finishIt(err, stdout, stderr) {
  if (err) {
    console.log(err)
    process.exit(1)
  } else {
    // Look for the extracted directory, so we can rename it.
    var files = fs.readdirSync(DOWNLOAD_DIR)
    for (var i = 0; i < files.length; i++) {
      var file = path.join(DOWNLOAD_DIR, files[i])
      if (fs.statSync(file).isDirectory()) {
        console.log('Renaming extracted folder', files[i], ' -> phantom')
        fs.renameSync(file, path.join(DOWNLOAD_DIR, 'phantom'))
        break
      }
    }
    console.log('Done')
  }
}
