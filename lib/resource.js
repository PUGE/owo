"use strict"
const fs = require('fs')
const path = require('path')
const Cut = require('./cut')

// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

// 复制文件到指定路径
// 待优化 重复的函数
function moveFile (fromPath, toPath) {
  fs.readFile(fromPath, (err, fileData) => {
    if (err) throw err
    fs.writeFile(toPath, fileData, () => {
      logger.info(`copy resource: ${toPath}`)
    })
  })
}

// 判断输出目录是否存在,如果不存在则创建目录
function creatDirIfNotExist (path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

function resourceHandle (textData, resourceFolder, outResourceFolder, prefix) {
  // 判断输出目录是否存在
  creatDirIfNotExist(outResourceFolder)

  textData = textData.replace(/&amp;/g, '&')
  // 取出用到的所有资源
  let resourceList = Cut.stringArray(textData, '@&', '&')
  // console.log(resourceList)
  resourceList.forEach(element => {
    const filePath = path.join(resourceFolder, element)
    // 判断资源目录是否有这个资源
    if (fs.existsSync(filePath)) {
      const outFilePath = path.join(outResourceFolder, element)
      // console.log(filePath, outFilePath)
      if (!fs.existsSync(outFilePath)) {
        moveFile(filePath, outFilePath)
      } else {
        logger.debug(`ignore file: ${filePath}`)
      }
    } else {
      logger.error(`resource file not found: ${filePath}`)
    }
    // 替换模板
    textData = textData.replace(`@&${element}&`, prefix + element)
  })
  return textData
}

module.exports = resourceHandle