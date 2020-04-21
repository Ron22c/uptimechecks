const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

let logs = {}

logs.baseDir = path.join(__dirname, '/../.logs/')

logs.append = function(fileName, data, callback) {
  fs.open(logs.baseDir+fileName+'.log', 'a', function(err, fd) {
    if(!err && fd) {
      fs.appendFile(fd, data+'\n', function(err) {
        if(!err) {
          fs.close(fd, function(err) {
            if(!err) {
              callback(false)
            } else {
            callback(err)
            }
          })
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })
}

logs.list = function(allowCompressed, callback) {
  fs.readdir(logs.baseDir, function(err, data) {
    if(!err && data && data.length >0) {
      let filesToReturn = []
      data.forEach(function(file){
        if(file.indexOf('.log')>-1) {
          filesToReturn.push(file.replace('.log', ''))
        }
        if(file.indexOf('.gz.b64')>-1 && allowCompressed) {
          filesToReturn.push(file.replace('.gz.b64', ''))
        }
      })
      callback(false, filesToReturn)
    } else {
      callback(err)
    }
  })
}

logs.compress = function(fileId, newFileId, callback) {
  let src = fileId+'.log'
  let dest = newFileId+'.gz.b64'

  fs.readFile(logs.baseDir+src, 'utf8', function(err, data) {
    if(!err && data) {
      zlib.gzip(data, function(err, buffer) {
        if(!err && buffer) {
          fs.open(logs.baseDir+dest, 'wx', function(err, fd) {
            if(!err && fd) {
              fs.write(fd, buffer.toString('base64'), function(err) {
                if(!err) {
                  fs.close(fd, function(err) {
                    if(!err) {
                      callback(false)
                    } else {
                      callback(err)
                    }
                  })
                } else {
                  callback(err)
                }
              })
            } else {
              callback(err)
            }
          })
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })
}

logs.deCompress = function(fileId, callback) {
  fs.readFile(logs.baseDir+fileId+'.gz.b64', 'utf8', function(err, data) {
    if(!err && data) {
      let stringData = Buffer.from(data, 'base64')
      zlib.unzip(stringData, function(err, buffer) {
        if(!err && buffer) {
          callback(false, buffer.toString())
        } else {
          callback(err)
        }
      })
    } else {
      callback(err)
    }
  })
}

logs.truncate = function(fileName, callback) {
  fs.truncate(logs.baseDir+fileName+'.log', function(err){
    if(!err) {
      callback(false)
    } else{
      callback(err)
    }
  })
}

module.exports = logs
