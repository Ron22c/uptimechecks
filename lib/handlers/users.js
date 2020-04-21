const _data = require('../data')
const helpers = require('../helpers')
const _tokens = require('./tokens')

let users = {}

users.get = function(data, callback) {
  let phone = typeof(data.queryParams.phone)=='string' && data.queryParams.phone.trim().length == 10 ? data.queryParams.phone.trim() : false
  let token = typeof(data.headers.token)=='string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false
  if(phone && token) {
    _data.read('tokens',token, function(err, tokenData){
      if(!err && tokenData) {
        _tokens.validateToken(token, phone, function(isValid) {
          if(isValid) {
            _data.read('users', phone, function(err, userData) {
              if(!err && userData) {
                delete userData.password
                callback(200, userData)
              } else {
                callback(404,{'error': 'user not found'})
              }
            })
          } else {
            callback(403)
          }
        })
      } else {
        callback(403,{'error':'token not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required field -> phone token'})
  }
}

users.post = function(data, callback) {
  let firstName = typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  let lastName = typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  let phone = typeof(data.payload.phone)=='string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  let password = typeof(data.payload.password)=='string' && data.payload.password.trim().length > 5 ? data.payload.password.trim() : false
  let terms = typeof(data.payload.toa)=='boolean'? data.payload.toa : false
  if (firstName&&lastName&&phone&&password&&terms) {
    _data.read('users', phone, function(err, data) {
      if(err) {
        let hashedPhone = helpers.hash(password)
        let userData = {
          'firstName': firstName,
          'lastName':lastName,
          'phone':phone,
          'password':hashedPhone,
          'terms':terms
        }
        _data.create('users', phone, userData, function(err) {
          if(!err) {
            callback(202)
          } else {
            callback(500, {'error':'unable to create the user'})
          }
        })
      } else {
        callback(400, {'error': 'user already exist with the same phone'})
      }
    })
  } else {
    callback(400, {'error': 'missing required fields -> firstName lastName phone password terms'})
  }
}

users.put = function(data, callback) {
  let firstName = typeof(data.payload.firstName)=='string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  let lastName = typeof(data.payload.lastName)=='string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  let phone = typeof(data.payload.phone)=='string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  let password = typeof(data.payload.password)=='string' && data.payload.password.trim().length > 5 ? data.payload.password.trim() : false
  let token = typeof(data.headers.token)=='string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false

  if(phone) {
    if(firstName||lastName||phone||password) {
      _tokens.validateToken(token, phone, function(isValid) {
        if(isValid) {
          _data.read('users', phone, function(err, userData) {
            if(!err && userData) {
              if(firstName) {
                userData.firstName = firstName
              }
              if(lastName) {
                userData.lastName = lastName
              }
              if(phone) {
                userData.phone = phone
              }
              if(password) {
                userData.password = helpers.hash(password)
              }
              _data.update('users',phone, userData, function(err) {
                if(!err){
                  callback(200)
                } else{
                  callback(500,{'error':'unable to update'})
                }
              })
            } else {
              callback(404,{'error': 'user not found'})
            }
          })
        } else {
          callback(403, {'error': 'token not valid'})
        }
      })
    } else {
      callback(400, {'error': 'there are no fields to update -> firstName lastName phone password'})
    }
  } else {
    callback(400, {'error': 'missing required fields -> phone'})
  }
}

users.delete = function(data, callback) {
  let phone = typeof(data.queryParams.phone)=='string' && data.queryParams.phone.trim().length == 10 ? data.queryParams.phone.trim() : false
  let token = typeof(data.headers.token)=='string' && data.headers.token.trim().length == 20 ? data.headers.token.trim() : false
  if(phone && token) {
    _data.read('tokens',token, function(err, tokenData){
      if(!err && tokenData) {
        _tokens.validateToken(token, phone, function(isValid) {
          if(isValid) {
            _data.read('users', phone, function(err, userData) {
              if(!err && userData) {
                _data.delete('users', phone, function(err) {
                  if(!err) {
                    let userChecks = typeof(userData.checks)=='object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks : []
                    if(userChecks.length > 0){
                      let checksToDelete = userChecks.length
                      let checksDeleted = 0
                      let error = false
                      userChecks.forEach(function(check) {
                        _data.delete('checks', check, function(err){
                          if(!err) {
                            checksDeleted+=1
                            if(checksDeleted == checksToDelete){
                              if(!error) {
                                callback(200)
                              } else{
                                callback(500, {'error': 'unable to delete all the checks created by the user'})
                              }
                            }
                          } else{
                            error=true
                            callback(500, {'error': 'unable to delete all the checks created by the user'})
                          }
                        })
                      })
                    } else {
                      callback(200)
                    }
                  } else {
                    callback(500, {'error': 'unable to update'})
                  }
                })
              } else {
                callback(404,{'error': 'user not found'})
              }
            })
          } else {
            callback(403)
          }
        })
      } else {
        callback(403,{'error':'token not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required field -> phone token'})
  }
}

module.exports = users
