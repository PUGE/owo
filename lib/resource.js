"use strict"
const fs = require('fs')
const path = require('path')
const Cut = require('./cut')
const Tool = require('./tool')

// 图片处理
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')

// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

const imgSuffix = ['png', 'jpg']



function resourceHandle (textData, resourceFolder, outResourceFolder, prefix) {
  // 判断输出目录是否存在
  Tool.creatDirIfNotExist(outResourceFolder)

  // 等待进行处理的文件列表
  let fileList = []

  textData = textData.replace(/&amp;/g, '&')
  // 取出用到的所有资源
  let resourceList = Cut.stringArray(textData, '@&', '&')
  // console.log(resourceList)
  resourceList.forEach(element => {
    const filePath = path.join(resourceFolder, element)
    
    // 判断资源目录是否有这个资源
    if (fs.existsSync(filePath)) {
      // 输出文件的路径
      const outFilePath = path.join(outResourceFolder, element)
      // console.log(filePath, outFilePath)
      // 判断输出目录是否有这个文件，如果没有才进行生成
      if (!fs.existsSync(outFilePath)) {
        // 判断文件类行进行针对操作
        // 取文件后缀
        const suffix = element.split('.').pop()

        // 判断是否为图片文件
        if (imgSuffix.includes(suffix)) {
          fileList.push(filePath)
        } else {
          // 其他文件的话进行复制处理
          Tool.moveFile(filePath, outFilePath)
        }
        
      } else {
        logger.debug(`ignore file: ${filePath}`)
      }
    } else {
      logger.error(`resource file not found: ${filePath}`)
    }
    // 替换模板
    textData = textData.replace(`@&${element}&`, prefix + element)
  })
  // console.log(fileList)
  // 同意压缩处理文件
  imagemin(fileList, outResourceFolder, {
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8]
      })
    ]
  })
  return textData
}

module.exports = resourceHandle