const server = require('./lib/server')
const workers = require('./lib/workers')

app = {}

app.init = function() {
  server.init()
  workers.init()
}

app.init()

module.exports = app
