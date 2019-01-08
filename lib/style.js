'use strict'
const Templet = require('./templet')

function styleHandle (htmlText, name) {
  const styleText = Templet.cutString(htmlText, "<style>", "</style>")
  // 取出所有Body标识
  const styleArr = Templet.cutStringArray(styleText, "{", "}")
  // 取出所有的标签名
  const styleNameArr = Templet.cutStringArray(styleText, `\n`, "{", 0 , true)
  // console.log(styleArr)
  let newStyleNameArr = []
  // console.log(styleNameArr)
  for (let key in styleNameArr) {
    newStyleNameArr[key] = `.page-class-${name} ${Templet.trim(styleNameArr[key])} {${styleArr[key]}}`
  }
  // console.log(newStyleNameArr)
  return newStyleNameArr
}
module.exports = styleHandle