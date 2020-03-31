const Tool = require('./tool')
const fs = require('fs')
const Storage = require('../storage')
const request = require('request')
// 配置输出插件
const log = require('./log')

function handleLink(text, outPutPath, replacePath) {
  if (!Storage.handleLink) Storage.handleLink = []
  let linkList = new Set()
  let urlList = []
  urlList = urlList.concat(Tool.cutStringArray(text, 'href="', '"'))
  urlList = urlList.concat(Tool.cutStringArray(text, 'url(', ')'))
  urlList = urlList.concat(Tool.cutStringArray(text, 'src="', '"'))
  urlList.forEach(element => {
    element = element.replace(/"/g, '')
    if (element.startsWith('http')) {
      linkList.add(element)
    }
  })
  if (linkList.length === 0) return text
  // 文件夹不存在则创建文件夹
  if (!fs.existsSync(outPutPath)) {
    fs.mkdirSync(outPutPath)
  }
  linkList.forEach(url => {
    let fileName = url.split('/')
    fileName = fileName[fileName.length - 1]
    const modulesPath = outPutPath + fileName
    request(url).pipe(fs.createWriteStream(modulesPath))
    const newPath = `${replacePath}${fileName}`
    Storage.handleLink.push({
      original: url,
      replace: newPath
    })
    text = text.replace(url, newPath)
  })
  return text
}

module.exports = handleLink