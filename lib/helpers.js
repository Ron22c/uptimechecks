const crypto = require('crypto')
const querystring = require('querystring')
const https = require('https')
const config = require('./config')

let helpers = {}

helpers.stringToJson = function(data){
  try{
    let obj = JSON.parse(data)
    return obj
  } catch(e) {
    // console.log(e)
    return false
  }
}

helpers.hash = function(str) {
  let hash = crypto.createHmac('sha256', 'config.hashKey').update(str).digest('hex')
  return hash
}

helpers.getUniqueString = function(num) {
  let supportedChars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let char = ''
  for(let i=0; i<num;i++){
    char+=supportedChars.charAt(Math.floor(Math.random()*supportedChars.length))
  }
  return char
}

helpers.sendTwilioMessage = function(phone, msg, callback) {
  let payload = {
    'From': config.twilio.fromNumber,
    'To': '+91'+phone,
    'Body': msg
  }
  let stringPayload = querystring.stringify(payload)

  let requestObject = {
    'protocol':'https:',
    'method': 'POST',
    'hostname':'api.twilio.com',
    'path':'/2010-04-01/Accounts/'+config.twilio.apiKey+'/Messages.json',
    'auth':config.twilio.apiKey+':'+config.twilio.secretKey,
    'headers' : {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload)
    }
  }

  let req = https.request(requestObject, function(res) {
    let status = res.statusCode
    if(status == 200 || status==201){
      callback(false)
    } else {
      callback('error with status code: '+status)
    }
  })

  req.on('error', function(e) {
    callback(e)
  })

  req.end(stringPayload)

}

module.exports = helpers
