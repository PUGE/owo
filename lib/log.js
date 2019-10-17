'use strict'
const fs = require('fs')
const log4js = require('log4js')

fs.unlinkSync('owo.log')

log4js.configure({
  appenders: {
    toFile: { type: 'file', filename: 'owo.log' }
  },
  categories: {
    default: {
      appenders: ['toFile'],
      level: 'debug'
    }
  }
})

// 配置输出插件
let logger = null

function log () {
  if (!logger) {
    logger = log4js.getLogger()
  }
  return logger
}

module.exports = log