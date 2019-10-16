'use strict'
const log4js = require('log4js')

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