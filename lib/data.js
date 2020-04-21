const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

let lib = {}

lib.baseDir = path.join(__dirname, '/../.data/')

lib.create= function(dirName, fileName, data, callback) {
  fs.open(lib.baseDir+dirName+'/'+fileName+'.json', 'wx', function(err, fd) {
    if(!err && fd) {
      let stringData = JSON.stringify(data)
      fs.writeFile(fd, stringData, function(err) {
        if(!err) {
          fs.close(fd, function(err) {
            if(!err){
              callback(false)
            } else {
              callback('error:unable to close the file')
            }
          })
        } else {
          callback('error:unable to write the file')
        }
      })
    } else {
      callback('error:unable to open the file')
    }
  })
}

lib.read = function(dirName, fileName, callback) {
  fs.readFile(lib.baseDir+dirName+'/'+fileName+'.json', function(err, data) {
    if(!err && data){
      let dataObj = helpers.stringToJson(data)
      callback(false,dataObj)
    } else {
      callback(err, data)
    }
  })
}

lib.update = function(dirName, fileName, data, callback) {
  fs.open(lib.baseDir+dirName+'/'+fileName+'.json', 'r+', function(err, fd) {
    if(!err) {
      fs.ftruncate(fd, function(err) {
        if(!err) {
          let dataString = JSON.stringify(data)
          fs.write(fd, dataString, function(err) {
            if(!err) {
              fs.close(fd, function(err) {
                if(!err) {
                  callback(false)
                } else {
                  callback('error: unable to write the file')
                }
              })
            } else {
              callback('error: unable to write the file')
            }
          })
        } else {
          callback('error: unable to truncate the file')
        }
      })
    } else {
      callback('error: unable to read the file')
    }
  })
}

lib.delete = function(dirName, fileName, callback) {
  fs.unlink(lib.baseDir+dirName+'/'+fileName+'.json',function(err) {
    if(!err) {
      callback(false)
    } else {
      callback('error: unable to read the file')
    }
  })
}

lib.list = function(dirName, callback) {
  let dataTrimmed = []
  fs.readdir(lib.baseDir+dirName+'/', function(err, data) {
    if(!err && data) {
      data.forEach(function(filename){
        dataTrimmed.push(filename.replace('.json',''))
      })
      callback(false, dataTrimmed)
    } else {
      callback(err, data)
    }
  })
}

module.exports = lib
