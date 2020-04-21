const _data = require('../data')
const helpers = require('../helpers')

let tokens = {}

tokens.get = function(data, callback) {
  let token = typeof(data.queryParams.id)=='string' && data.queryParams.id.trim().length == 20 ? data.queryParams.id.trim() : false
  if(token) {
    _data.read('tokens', token, function(err, data) {
      if(!err && data) {
        callback(200, data)
      } else {
        callback(404,{'error': 'token not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required fields -> id'})
  }
}

tokens.post = function(data, callback) {
  let phone = typeof(data.payload.phone)=='string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false
  let password = typeof(data.payload.password)=='string' && data.payload.password.trim().length > 5 ? data.payload.password.trim() : false

  if(phone && password) {
    _data.read('users', phone, function(err, data) {
      if(!err && data) {
        let hashedPassword = helpers.hash(password)
        if(hashedPassword == data.password) {
          let token = helpers.getUniqueString(20)
          let expires = Date.now() + 1000*60*60
          let tokenData = {
            'phone': phone,
            'token': token,
            'expires': expires
          }
          _data.create('tokens', token, tokenData, function(err) {
            if(!err) {
              callback(200, tokenData)
            } else {
              callback(500, {'error': 'unable to create token'})
            }
          })
        } else {
          callback(403)
        }
      } else {
        callback(404, {'error': 'user not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required field -> phone password'})
  }
}

tokens.put = function(data, callback) {
  let token = typeof(data.payload.id)=='string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
  let extend = typeof(data.payload.extend)=='boolean'? data.payload.extend : false

  if(token && extend){
    _data.read('tokens', token, function(err, data) {
      if(!err && data) {
        if(data.expires > Date.now()){
          data.expires = Date.now()+1000*60*60
          _data.update('tokens', token, data, function(err) {
            if(!err) {
              callback(200)
            } else {
              callback(500, {'error': 'unable to update token'})
            }
          })
        } else {
          callback(400, {'error':'unable to update token, token is already expired'})
        }
      } else {
        callback(404,{'error': 'token not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required fields -> token extend'})
  }
}

tokens.delete = function(data, callback) {
  let token = typeof(data.queryParams.id)=='string' && data.queryParams.id.trim().length == 20 ? data.queryParams.id.trim() : false
  if(token) {
    _data.read('tokens', token, function(err, data) {
      if(!err && data) {
        _data.delete('tokens', token, function(err) {
          if(!err) {
            callback(200)
          } else {
            callback(500, {'error': 'unable to delete token'})
          }
        })
      } else {
        callback(404,{'error': 'token not found'})
      }
    })
  } else {
    callback(400, {'error': 'missing required fields -> id'})
  }
}

tokens.validateToken = function(token, phone, callback) {
  _data.read('tokens', token, function(err, data) {
    if(!err && data) {
      if(data.phone == phone && data.expires > Date.now()){
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}

module.exports = tokens
