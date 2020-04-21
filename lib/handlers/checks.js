const _data = require('../data')
const helpers = require('../helpers')
const _tokens = require('./tokens')
const config = require('../config')

let checks = {}

checks.get = function(data, callback) {
  let id = typeof(data.queryParams.id)=='string' && data.queryParams.id.trim().length == 20 ? data.queryParams.id.trim() : false
  let token = typeof(data.headers.token)=='string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false

  if(id&&token) {
    _data.read('tokens', token, function(err, tokenData) {
      if(!err && tokenData) {
        _tokens.validateToken(token, tokenData.phone, function(isValid) {
          if(isValid) {
            _data.read('checks', id, function(err, checkData) {
              if(!err && checkData) {
                callback(200, checkData)
              } else{
                callback(404, {'error': 'check not found'})
              }
            })
          } else {
            callback(403)
          }
        })
      } else{
        callback(403,{'error': 'token not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required field -> id token'})
  }
}

checks.post = function(data, callback) {
  let supportedProtocol = ['http', 'https']
  let supportedMethods = ['get', 'post', 'put', 'delete']

  let protocol = typeof(data.payload.protocol) == 'string' && supportedProtocol.indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false
  let method = typeof(data.payload.method) == 'string' && supportedMethods.indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false
  let successStatus = typeof(data.payload.successStatus) == 'object' && data.payload.successStatus instanceof Array && data.payload.successStatus.length > 0 ? data.payload.successStatus:false
  let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() :false
  let timeOut = typeof(data.payload.timeOut) == 'number' && data.payload.timeOut > 0 ? data.payload.timeOut :false

  if(protocol&&method&&successStatus&&url&&timeOut) {
    let token = typeof(data.headers.token)=='string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false
    _data.read('tokens', token, function(err, tokenData) {
      if(!err && tokenData) {
        _tokens.validateToken(token, tokenData.phone, function(isValid) {
          if(isValid) {
            _data.read('users', tokenData.phone, function(err, userData) {
              if(!err && userData) {
                let userChecks = typeof(userData.checks)=='object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks : []
                if(userChecks.length < config.maxCheck) {
                  let checkId = helpers.getUniqueString(20)
                  let checkData = {
                    'id':checkId,
                    'phone':userData.phone,
                    'protocol': protocol,
                    'method': method,
                    'successStatus': successStatus,
                    'url': url,
                    'timeOut':timeOut
                  }
                  _data.create('checks', checkId, checkData, function(err) {
                    if(!err) {
                      userData.checks = userChecks
                      userData.checks.push(checkId)
                      _data.update('users', userData.phone, userData, function(err) {
                        if(!err) {
                          callback(202, checkData)
                        } else {
                          callback(500, {'error': 'unable to save user data'})
                        }
                      })
                    } else {
                      callback(500, {'error': 'unable to save checks'})
                    }
                  })

                } else {
                  callback(400,{'error': 'you have exeeded the max checks!! please delete checks to create new check'})
                }
              } else {
                callback(404, {'error': 'user not found'})
              }
            })
          } else {
            callback(403)
          }
        })
      } else {
        callback(403, {'error': 'unable to find token'})
      }
    })
  } else {
    callback(400, {'error': 'missing required field -> protocol method successCodes url timeOut'})
  }
}

checks.put = function(data, callback) {
  let supportedProtocol = ['http', 'https']
  let supportedMethods = ['get', 'post', 'put', 'delete']

  let id = typeof(data.payload.id)=='string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
  let token = typeof(data.headers.token)=='string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false

  let protocol = typeof(data.payload.protocol) == 'string' && supportedProtocol.indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false
  let method = typeof(data.payload.method) == 'string' && supportedMethods.indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false
  let successStatus = typeof(data.payload.successStatus) == 'object' && data.payload.successStatus instanceof Array && data.payload.successStatus.length > 0 ? data.payload.successStatus:false
  let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() :false
  let timeOut = typeof(data.payload.timeOut) == 'number' && data.payload.timeOut > 0 ? data.payload.timeOut :false

  if(id && token){
    if(protocol||method||successStatus||url||timeOut) {
      _data.read('tokens', token, function(err, tokenData) {
        _tokens.validateToken(token, tokenData.phone, function(isValid) {
          if(isValid){
            _data.read('checks', id, function(err, checkData) {
              if(!err && checkData) {
                if(protocol) {
                  checkData.protocol = protocol
                }
                if(method) {
                  checkData.method = method
                }
                if(successStatus) {
                  checkData.successStatus = successStatus
                }
                if(url) {
                  checkData.url = url
                }
                if(timeOut) {
                  checkData.timeOut = timeOut
                }
                _data.update('checks', id, checkData, function(err) {
                  if(!err) {
                    callback(202)
                  } else{
                    callback(500, {'error': 'unable to update checks'})
                  }
                })
              } else{
                callback(404, {'error': 'check not found'})
              }
            })
          } else {
            callback(403)
          }
        })
      })
    } else {
      callback(400, {'error': 'missing fields to update -> protocol method successCodes url timeOut'})
    }
  } else{
    callback(400, {'error': 'missing required field -> id token'})
  }
}

checks.delete = function(data, callback) {
  let id = typeof(data.queryParams.id)=='string' && data.queryParams.id.trim().length == 20 ? data.queryParams.id.trim() : false
  let token = typeof(data.headers.token)=='string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false

  if(id&&token) {
    _data.read('tokens', token, function(err, tokenData) {
      if(!err && tokenData) {
        _tokens.validateToken(token, tokenData.phone, function(isValid) {
          if(isValid) {
            _data.read('checks', id, function(err, checkData) {
              if(!err && checkData) {
                _data.read('users', tokenData.phone, function(err, userData) {
                  let checkIndex = userData.checks.indexOf(id) > -1 ? userData.checks.indexOf(id) : false
                  _data.delete('checks', id, function(err) {
                    if(!err) {
                      if(checkIndex>-1) {
                        userData.checks.splice(checkIndex, 1)
                        _data.update('users', tokenData.phone, userData, function(err) {
                          if(!err){
                            callback(200)
                          } else{
                            callback(500, {'error':'unable to delete entry from user check array'})
                          }
                        })
                      } else{
                        console.log('check index not found')
                        callback(200)
                      }
                    } else {
                      callback(500, {'error':'unable to delete check'})
                    }
                  })
                })
              } else{
                callback(404, {'error': 'check not found'})
              }
            })
          } else {
            callback(403)
          }
        })
      } else{
        callback(403,{'error': 'token not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required field -> id token'})
  }
}

module.exports = checks
