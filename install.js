// Copyright 2012 The Obvious Corporation.

/*
 * This simply fetches the right version of phantom for the current platform.
 */

'use strict'

var cp = require('child_process')
var fs = require('fs')
var http = require('http')
var path = require('path')
var url = require('url')
var unzip = require('unzip')

fs.existsSync = fs.existsSync || path.existsSync

var libPath = path.join(__dirname, 'lib')
var tmpPath = path.join(__dirname, 'tmp')

var downloadUrl = 'http://phantomjs.googlecode.com/files/phantomjs-1.7.0-'
var fileName

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
var downloadedFile = path.join(tmpPath, fileName)

function mkdir(name) {
  var dir = path.dirname(name)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

function getOptions() {
  if (process.env.http_proxy) {
    var options = url.parse(process.env.http_proxy)
    options.path = downloadUrl
    options.headers = { Host: url.parse(downloadUrl).host }
    return options
  } else {
    return url.parse(downloadUrl)
  }
}

function finishIt(err, stdout, stderr) {
  if (err) {
    console.log(err)
    process.exit(1)
  } else {
    // Look for the extracted directory, so we can rename it.
    var files = fs.readdirSync(tmpPath)
    for (var i = 0; i < files.length; i++) {
      var file = path.join(tmpPath, files[i])
      if (fs.statSync(file).isDirectory()) {
        console.log('Renaming extracted folder', files[i], ' -> phantom')
        fs.renameSync(file, path.join(libPath, 'phantom'))
        break
      }
    }
    console.log('Done')
  }
}

function extractIt() {
  var options = {
    cwd: tmpPath
  }

  if (fileName.substr(-4) === '.zip') {
    console.log('Extracting zip contents')
    var unzipStream = unzip.Extract({ path: path.dirname(downloadedFile) })
    fs.createReadStream(downloadedFile).pipe(unzipStream).on('end', finishIt)
  } else {
    console.log('Extracting tar contents (via spawned process)')
    cp.execFile('tar', ['jxf', downloadedFile], options, finishIt)
  }
}

function fetchIt() {
  var notifiedCount = 0
  var count = 0

  mkdir(downloadedFile)

  var outFile = fs.openSync(downloadedFile, 'w')

  var onData = function(data) {
    fs.writeSync(outFile, data, 0, data.length, null)
    count += data.length
    if ((count - notifiedCount) > 800000) {
      console.log('Recieved ' + Math.floor(count / 1024) + 'K...')
      notifiedCount = count
    }
  }

  var onEnd = function() {
    console.log('Recieved ' + Math.floor(count / 1024) + 'K total.')
    fs.closeSync(outFile)
    extractIt()
  }

  var onResponse = function(response) {
    var status = response.statusCode
    console.log('Receiving...')

    if (status === 200) {
      response.addListener('data', onData)
      response.addListener('end', onEnd)
    } else {
      console.log('Error with http request', response.headers)
      client.abort()
      process.exit(1)
    }
  }

  var client = http.get(getOptions(), onResponse)

  console.log('Requesting ' + downloadedFile)
}

fetchIt()