'use strict'
const fs = require('fs')
const path = require('path')
const Cut = require('./cut')

const { getLogger } = require('log4js')
const logger = getLogger()

// 处理Heard
function heardHandle (headList, htmlText) {
  logger.debug(`head list: ${headList}`)
  // 取出所有Heard标识
  let heardData = '<!-- 页面的元信息 -->'
  headList.forEach(element => {
    let heard = `\r\n    <meta`
    for (const key in element) {
      const value = element[key]
      heard += ` ${key}="${value}"`
    }
    heard += `/>`
    heardData += `${heard}`
  })
  htmlText = htmlText.replace(`<!-- *head* -->`, heardData)
  return htmlText
}
module.exports = heardHandle