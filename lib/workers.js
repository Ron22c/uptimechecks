const _data = require('./data')
const url = require('url')
const http = require('http')
const https = require('https')
const _logs = require('./logs')
const helpers = require('./helpers')

let workers = {}

workers.getAllChecks = function() {
  _data.list('checks', function(err, files) {
    if(!err && files && files.length > 0){
      files.forEach(function(file) {
        _data.read('checks', file, function(err, checkData) {
          if(!err && checkData) {
            workers.validateChecks(checkData)
          } else {
            console.log('unable to open the check');
          }
        })
      })
    } else {
      console.log('No file found to process')
    }
  })
}

workers.validateChecks = function(checkData) {
  let supportedProtocol = ['http', 'https']
  let supportedMethods = ['get', 'post', 'put', 'delete']
  let states = ['up', 'down']

  let protocol = typeof(checkData.protocol) == 'string' && supportedProtocol.indexOf(checkData.protocol.trim()) > -1 ? checkData.protocol.trim() : false
  let method = typeof(checkData.method) == 'string' && supportedMethods.indexOf(checkData.method.trim()) > -1 ? checkData.method.trim() : false
  let successStatus = typeof(checkData.successStatus) == 'object' && checkData.successStatus instanceof Array && checkData.successStatus.length > 0 ? checkData.successStatus:false
  let url = typeof(checkData.url) == 'string' && checkData.url.trim().length > 0 ? checkData.url.trim() :false
  let timeOut = typeof(checkData.timeOut) == 'number' && checkData.timeOut > 0 ? checkData.timeOut :false

  let state = typeof(checkData.state) == 'string' && states.indexOf(checkData.state.trim()) > -1 ? checkData.state.trim() : false
  let lastChecked = typeof(checkData.lastChecked) == 'number' && checkData.lastChecked > 0 ? checkData.lastChecked :false

  if(protocol&&method&&successStatus&&url&&timeOut) {
    workers.processRequest(checkData)
  } else {
    console.log('parameters are invalid or not present -> protocol method successStatus url timeOut')
  }
}

workers.processRequest = function(checkData) {
  let responseObject = {
    'responseStatus': false,
    'error' :false
  }

  let isCheckPerformed = false

  let parsedUrl = url.parse(checkData.protocol+'://'+checkData.url)
  let host = parsedUrl.host
  let path = parsedUrl.path

  let request = {
    'protocol':checkData.protocol+':',
    'method':checkData.method.toUpperCase(),
    'hostname':host,
    'path':path,
    'timeout':checkData.timeOut*1000
  }

  let reqModule = checkData.protocol=='http'?http:https

  let req = reqModule.request(request, function(res) {
    let statusCode = res.statusCode
    console.log('status code : '+statusCode)
    responseObject.responseStatus = statusCode
    if(!isCheckPerformed) {
      workers.processresponse(checkData, responseObject)
      isCheckPerformed = true
    }
  })

  req.on('error', function(e){
    console.log('Error is: '+e)
    responseObject.error = {
      'error': true,
      'valur':e
    }
    if(!isCheckPerformed) {
      workers.processresponse(checkData, responseObject)
      isCheckPerformed = true
    }
  })

  req.on('timeout', function(){
    responseObject.error = {
      'error': true,
      'valur': 'timeout'
    }
    if(!isCheckPerformed) {
      workers.processresponse(checkData, responseObject)
      isCheckPerformed = true
    }
  })

  req.end()
}

workers.processresponse = function(checkData, responseObject) {

  let state = !responseObject.error && responseObject.responseStatus && checkData.successStatus.indexOf(responseObject.responseStatus) > -1 ? 'up':'down'
  let lastChecked = typeof(checkData.lastChecked) == 'number' && checkData.lastChecked > 0 ? checkData.lastChecked :false
  let shouldalertUser = lastChecked && state != checkData.state

  let timeNow = Date.now()
  workers.log(checkData, responseObject, state, shouldalertUser, timeNow)

  checkData.state = state
  checkData.lastChecked = timeNow

  _data.update('checks', checkData.id, checkData, function(err) {
    if(!err) {
      if(shouldalertUser) {
        workers.sendNortification(checkData)
      } else {
        console.log('no need to send nortification, state did not changed')
      }
    } else {
      console.log('unable to save check')
    }
  })
}

workers.sendNortification= function(checkData) {
  let message = 'Your website is'+checkData.url+ ' is now '+checkData.state
  helpers.sendTwilioMessage(checkData.phone, message, function(err) {
    if(!err) {
      console.log('success');
    } else {
      console.log('Failed to send nortification to user: '+err);
    }
  })
}

workers.log = function(checkData, responseObject, state, shouldalertUser, timeNow) {

  let logObject = {
    'checkData': checkData,
    'responseObject': responseObject,
    'state': state,
    'shouldalertUser': shouldalertUser,
    'timeNow': timeNow
  }

  let stringLogObject = JSON.stringify(logObject)

  let fileName = checkData.id

  _logs.append(fileName, stringLogObject, function(err) {
    if(!err) {
      console.log('success')
    } else {
      console.log(err)
    }
  })
}

workers.compressLogs = function() {
  _logs.list(false, function(err, data) {
    if(!err && data && data.length>0) {
      data.forEach(function(file) {
        let fileName = file
        let newFileName = file+'-'+Date.now()
        _logs.compress(fileName, newFileName, function(err) {
          if(!err) {
            _logs.truncate(fileName, function(err) {
              if(!err) {
                console.log('success: logs compressed and deleted')
              } else {
                console.log(err)
              }
            })
          } else {
            console.log(err)
          }
        })
      })
    } else {
      console.log(err)
    }
  })
}

workers.compressLoop = function() {
  setInterval(function() {
    workers.compressLogs()
  }, 1000*60*60*24)
}

workers.loop = function() {
  setInterval(function(){
    workers.getAllChecks()
  }, 1000*60*60)
}

workers.init = function() {
  workers.getAllChecks()
  workers.loop()
  workers.compressLogs()
  workers.compressLoop()
}

module.exports=workers
