'use strict'
const fs = require('fs')
const path = require('path')
const Cut = require('./cut')

// 处理Heard
function heardHandle (headPath, htmlText) {
  // 取出所有Heard标识
  const heardTempletArr = Cut.stringArray(htmlText, "<!-- *head-", "* -->")
  heardTempletArr.forEach(element => {
    // 判断head模板目录中是否有指定heard
    const headFilePath = path.join(headPath, element + '.head')
    if (fs.existsSync(headFilePath)) {
      // 读取出Head模板内容
      const headFileContent = fs.readFileSync(headFilePath, 'utf8')
      // 解析出head内容
      const headContent = Cut.string(headFileContent, '<templet>', '</templet>')
      htmlText = htmlText.replace(`<!-- *head-${element}* -->`, headContent)
    } else {
      console.error(`heard模板:${headFilePath}不存在!`)
    }
  })
  return htmlText
}
module.exports = heardHandle