const _users = require('./users')
const _tokens = require('./tokens')
const _checks = require('./checks')

let handlers = {}

handlers.ping = function(data, callback) {
  callback(200, {'success':'server is up and running'})
}

handlers.notFoundHandler = function(data, callback) {
  callback(404)
}

handlers.users = function(data, callback) {
  let supportedMethods = ['get', 'post', 'put', 'delete']
  if(supportedMethods.indexOf(data.method) > -1) {
    _users[data.method](data, callback)
  } else {
    callback(405)
  }
}

handlers.tokens = function(data, callback) {
  let supportedMethods = ['get', 'post', 'put', 'delete']
  if(supportedMethods.indexOf(data.method) > -1) {
    _tokens[data.method](data, callback)
  } else {
    callback(405)
  }
}

handlers.checks = function(data, callback) {
  let supportedMethods = ['get', 'post', 'put', 'delete']
  if(supportedMethods.indexOf(data.method) > -1) {
    _checks[data.method](data, callback)
  } else {
    callback(405)
  }
}

module.exports = handlers
