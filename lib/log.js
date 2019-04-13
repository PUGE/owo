'use strict'
const fs = require('fs')
const path = require('path')

// 配置输出插件
let logObj = null
// 命令行运行目录
const runPath = process.cwd()

function log () {
  if (!logObj) {
    // 删除上次打包生成的配置文件
    const logFile = path.join(runPath, 'owo.log')
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile)
    }
    logObj = require('simple-node-logger').createSimpleFileLogger({
      logFilePath: 'owo.log',
      dateFormat: 'YYYY-MM-DD HH:mm:ss.SSS'
    })
    logObj.setLevel('debug')
  }
  return logObj
}

module.exports = log