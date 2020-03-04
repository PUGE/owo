const Tool = require('./tool')
const fs = require('fs')
const path = require('path')
const request = require('request')
// 配置输出插件
const log = require('./log')

function handleLink(text, outPutPath) {
  let linkList = new Set()
  let urlList = []
  urlList = urlList.concat(Tool.cutStringArray(text, 'href="', '"'))
  urlList = urlList.concat(Tool.cutStringArray(text, 'url(', ')'))
  urlList = urlList.concat(Tool.cutStringArray(text, 'src="', '"'))
  urlList.forEach(element => {
    element = element.replace(/"/g, '')
    if (element.startsWith('http') && element.endsWith('.png')) {
      linkList.add(element)
    }
  })
  linkList.forEach(url => {
    let fileName = url.split('/')
    fileName = fileName[fileName.length - 1]
    const modulesPath = outPutPath + fileName
    request(url).pipe(fs.createWriteStream(modulesPath))
    text = text.replace(url, `./static/resource/${fileName}`)
  })
  return text
}

module.exports = handleLink