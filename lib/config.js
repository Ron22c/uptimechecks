config = {}

config.staging = {
  'httpPort':3000,
  'httpsPort':3001,
  'envName':'staging',
  'maxCheck':5,
  'twilio' : {
    'apiKey' : 'ACa****************81db',
    'secretKey' : '24****************ba18055',
    'fromNumber' : '+186******21'
  }
}

config.production = {
  'httpPort':5000,
  'httpsPort':5001,
  'envName':'production',
  'maxCheck':5,
  'twilio' : {
    'apiKey' : 'ACa****************81db',
    'secretKey' : '24****************ba18055',
    'fromNumber' : '+186******21'
  }
}

let currentEnv = typeof(process.env.NODE_ENV) == 'string' && process.env.NODE_ENV.trim().length > 0 ? process.env.NODE_ENV.trim() : ''
let envToExport = config.hasOwnProperty(currentEnv) ? config[currentEnv] : config.staging

module.exports = envToExport
