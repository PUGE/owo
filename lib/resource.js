"use strict"
const fs = require('fs')
const path = require('path')
const Tool = require('./tool/tool')

// 图片处理
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')

// 配置输出插件
const log = require('./tool/log')()

const imgSuffix = ['png', 'jpg']

// 已经处理过的图片列表
// 待修复 如果图片的路径没变但是内容变了就不会重新打包
let tempList = []


async function miniImg (imageList, outResourceFolder) {
  // 对资源路径做特殊处理
  const image = Array.from(imageList)
  log.debug(`处理资源: `, image)
  log.debug('资源目录: ', outResourceFolder)
  await imagemin(image, {
    destination: outResourceFolder,
    plugins: [
      imageminJpegtran(),
      imageminPngquant({
        quality: [0.6, 0.8]
      })
    ]
  })
}

/**
 * 资源处理
 * @param  {number} textData           包含有资源的文本
 * @param  {number} resourceFolder     资源文件夹
 * @param  {number} outResourceFolder  输出文件就
 * @param  {number} prefix             前缀
 * @param  {number} embedSize             小于多大的资源会嵌入到代码中,单位kb,默认10,设置为0则不启用
 * @return {object} 处理后的返回结果
 */
function resourceHandle (textData, config, basePath, staticPath) {
  
  if (!config.resourceFolder) return textData
  // 命令行运行目录
  const runPath = process.cwd()
  let resourceFolder = path.join(runPath, config.resourceFolder)
  let outResourceFolder = path.join(staticPath, 'resource')
  let prefix =  `${basePath}resource/`
  let embedSize = config.outPut.embedSize
  
  // 那个imagemin破框架7.0版本只支持linux路径
  resourceFolder = resourceFolder.replace(/\\/g, '/')
  outResourceFolder = outResourceFolder.replace(/\\/g, '/')
  
  // 判断输出目录是否存在
  Tool.creatDirIfNotExist(outResourceFolder)

  // 等待进行处理的文件列表
  let imageList = new Set()
  if (typeof textData !== 'string') {
    throw 'textData类型不正确!'
  }
  
  // 取出用到的所有资源
  let resourceList = Tool.cutStringArray(textData, '@|', '|')
  resourceList.forEach(element => {
    const filePath = path.posix.join(resourceFolder, element)
    // 输出文件的路径
    const outFilePath = path.posix.join(outResourceFolder, element)
    // 待优化 太罗嗦
    // console.log(filePath, outFilePath)
    // 是否已经输出过此文件，如果没有才进行生成
    if (!tempList.includes(filePath)) {
      tempList.push(filePath)
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
            // 替换模板
            textData = textData.replace(`@|${element}|`, base64)
          } else {
            // 图片资源列表
            imageList.add(filePath)
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
    textData = textData.replace(`@|${element}|`, prefix + element)
  })
  
  // config.extraResource.forEach(element => {
  //   const dirent = fs.lstatSync(path.posix.join(runPath, element))
  //   console.log(dirent.isDirectory())
  // })
  // 判断需要处理的图片数量是否为空
  if (imageList.size > 0) {
    miniImg(imageList, outResourceFolder)
  }
  return textData
}

module.exports = resourceHandle