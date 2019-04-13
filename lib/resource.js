"use strict"
const fs = require('fs')
const path = require('path')
const Cut = require('./cut')
const Tool = require('./tool')

// 图片处理
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')

// 配置输出插件
const log = require('./log')()

const imgSuffix = ['png', 'jpg']



/**
 * 资源处理
 * @param  {number} textData           包含有资源的文本
 * @param  {number} resourceFolder     资源文件夹
 * @param  {number} outResourceFolder  输出文件就
 * @param  {number} prefix             前缀
 * @return {object} 处理后的返回结果
 */
function resourceHandle (textData, resourceFolder, outResourceFolder, prefix) {
  // 判断输出目录是否存在
  Tool.creatDirIfNotExist(outResourceFolder)

  // 等待进行处理的文件列表
  let imageList = []
  if (typeof textData !== 'string') {
    throw 'textData类型不正确!'
  }
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
          // 图片资源列表
          imageList.push(filePath)
        } else {
          // 其他文件的话进行复制处理
          Tool.moveFile(filePath, outFilePath)
        }
        
      } else {
        log.debug(`忽略文件: ${filePath}`)
      }
    } else {
      log.error(`找不到资源文件: ${filePath}`)
    }
    // 替换模板
    textData = textData.replace(`@&${element}&`, prefix + element)
  })
  // console.log(imageList)
  // 同意压缩处理文件
  imagemin(imageList, outResourceFolder, {
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8]
      })
    ]
  }).then((value) => {
    log.debug('文件处理成功:')
    value.forEach(element => {
      log.debug(element.path)
    })
  }, (err) => {
    log.debug('文件处理失败:')
    log.debug(err)
  })
  return textData
}

module.exports = resourceHandle