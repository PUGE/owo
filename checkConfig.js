"use strict"

import path from 'path'
import Tool from './lib/tool/tool.js'

function checkConfig (config) {
  // 判断并创建资源目录
  Tool.creatDirIfNotExist(path.join(process.cwd(), config.resourceFolder))
  // 创建模块下载文件夹(owo_modules目录)
  Tool.creatDirIfNotExist(path.join(process.cwd(), 'owo_modules'))
  return true
}

export default checkConfig