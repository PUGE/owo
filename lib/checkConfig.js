"use strict"
// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

function checkConfig (configData) {
  // 检查是否有输出目录
  if (!configData.outPut) {
    logger.error('没有设置输出目录!')
    return false
  }
  return true
}

module.exports = checkConfig