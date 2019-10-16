'use strict'
const log4js = require('log4js')

log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'owo.log' } },
  categories: {
    default: {
      appenders: ['cheese'],
      level: 'info'
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