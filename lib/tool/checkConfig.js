"use strict"
// 配置输出插件
const log = require('./log')

function checkConfig (configData) {
  // 检查是否有输出目录
  if (!configData.outPut) {
    log.error('没有设置输出目录!')
    return false
  }
  return true
}

module.exports = checkConfig