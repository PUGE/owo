"use strict"

const path = require('path')
const Tool = require('./lib/tool/tool')
const log = require('./lib/tool/log')

function checkConfig (config) {
  // 判断并创建资源目录
  Tool.creatDirIfNotExist(path.join(process.cwd(), config.resourceFolder))
  // 创建模块下载文件夹(owo_modules目录)
  Tool.creatDirIfNotExist(path.join(process.cwd(), 'owo_modules'))
  return true
}

module.exports = checkConfig