const http = require('http')
const https = require('https')
const url = require('url')
const stringdecoder = require('string_decoder').StringDecoder
const handlers = require('./handlers/handlers')
const helpers = require('./helpers')
const fs = require('fs')
const path = require('path')
const config = require('./config')

server = {}

server.httpParams = {
  'key': fs.readFileSync(path.join(__dirname,'../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname,'../https/cert.pem'))
}

server.httpServer = http.createServer(function(req, res) {
  server.unifiedServer(req, res)
})

server.httpsServer = https.createServer(server.httpParams, function(req, res) {
  server.unifiedServer(req, res)
})

server.unifiedServer = function(req, res) {
  let parsedUrl = url.parse(req.url, true)
  let method = req.method.toLowerCase()
  let headers = req.headers
  let path = parsedUrl.pathname
  let trimmedPath = path.replace(/^\/+|\/+$/g, '')
  let queryParams = parsedUrl.query

  let decoder = new stringdecoder('utf-8')
  let payload = ''

  req.on('data', function(data) {
    payload += decoder.write(data)
  })

  req.on('end', function() {
    payload += decoder.end()

    let chosenHandler = server.router.hasOwnProperty(trimmedPath) ? server.router[trimmedPath] : handlers.notFoundHandler
    let data = {
      'path':trimmedPath,
      'method':method,
      'queryParams':queryParams,
      'payload':helpers.stringToJson(payload),
      'headers':headers
    }

    chosenHandler(data, function(statusCode, payload) {
      statusCode = typeof(statusCode)=='number' && statusCode > 0 ? statusCode : 200
      payload = typeof(payload) == 'object' ? payload: {}
      let stringPayload = JSON.stringify(payload)
      console.log(statusCode+':'+method+':'+stringPayload)
      res.setHeader('Content-Type','application/json')
      res.writeHead(statusCode)
      res.end(stringPayload)
    })
  })
}

server.router = {
  'ping':handlers.ping,
  'users':handlers.users,
  'tokens':handlers.tokens,
  'checks':handlers.checks
}

server.init = function() {
  server.httpServer.listen(config.httpPort, function(){
    console.log('server up on port: '+config.httpPort)
  })

  server.httpsServer.listen(config.httpsPort, function(){
    console.log('server up on port: '+config.httpsPort)
  })
}

module.exports = server
