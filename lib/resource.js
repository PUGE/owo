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

// 已经处理过的图片列表
// 待修复 如果图片的路径没变但是内容变了就不会重新打包
let tempList = {}

/**
 * 资源处理
 * @param  {number} textData           包含有资源的文本
 * @param  {number} resourceFolder     资源文件夹
 * @param  {number} outResourceFolder  输出文件就
 * @param  {number} prefix             前缀
 * @param  {number} prefix             小于多大的资源会嵌入到代码中,单位kb,默认10,设置为0则不启用
 * @return {object} 处理后的返回结果
 */
function resourceHandle (textData, resourceFolder, outResourceFolder, prefix, embedSize) {
  
  // 判断输出目录是否存在
  Tool.creatDirIfNotExist(outResourceFolder)

  // 等待进行处理的文件列表
  let imageList = new Set()
  if (typeof textData !== 'string') {
    throw 'textData类型不正确!'
  }
  textData = textData.replace(/&amp;/g, '&')
  // 取出用到的所有资源
  let resourceList = Cut.stringArray(textData, '@&', '&')
  // console.log(resourceList)
  resourceList.forEach(element => {
    const filePath = path.join(resourceFolder, element)
    // 输出文件的路径
    const outFilePath = path.join(outResourceFolder, element)
    // 待优化 太罗嗦
    // console.log(filePath, outFilePath)
    // 是否已经输出过此文件，如果没有才进行生成
    if (!tempList[filePath]) {
      // 判断资源目录是否有这个资源
      if (fs.existsSync(filePath)) {
        // 判断文件类行进行针对操作
        // 取文件后缀
        const suffix = element.split('.').pop()
        // 判断是否为图片文件
        if (imgSuffix.includes(suffix)) {
          // 获取文件信息
          // console.log(fs.statSync(filePath).size / 1024)
          // 判断文件大小是否需要打包到代码中
          // console.log(embedSize, fs.statSync(filePath).size / 1024)
          if (embedSize && embedSize > (fs.statSync(filePath).size / 1024)) {
            log.debug(`base64处理文件: ${filePath}`)
            const base64 = `data:image/${suffix};base64,${Buffer.from(fs.readFileSync(filePath)).toString('base64')}`
            tempList[filePath] = base64
          } else {
            // 图片资源列表
            imageList.add(filePath)
            tempList[filePath] = prefix + element
          }
          
        } else {
          // 其他文件的话进行复制处理
          Tool.moveFile(filePath, outFilePath)
        }
        
      } else {
        log.error(`找不到资源文件: ${filePath}`)
      }
      
    } else {
      log.debug(`忽略文件: ${filePath}`)
    }
    // 替换模板
    textData = textData.replace(`@&${element}&`, tempList[filePath])
  })
  // console.log(Array.from(imageList))
  if (imageList.size > 0) {
    log.debug(`处理资源: ${Array.from(imageList)}`)
    // 同意压缩处理文件
    imagemin(Array.from(imageList), outResourceFolder, {
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
  }
  
  return textData
}

module.exports = resourceHandle