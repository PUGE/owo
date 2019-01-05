const Templet = require('./templet')

function styleHandle (htmlText, name) {
  // console.log(htmlText)
  const styleText = Templet.cutString(htmlText, "<style>", "</style>")
  // 取出所有Body标识
  const styleArr = Templet.cutStringArray(styleText, "{", "}")
  // 取出所有的标签名
  const styleNameArr = Templet.cutStringArray(styleText, `\n`, "{")
  // console.log(styleArr)
  let newStyleNameArr = []
  for (key in styleNameArr) {
    newStyleNameArr[key] = `.page-class-${name} ${Templet.trim(styleNameArr[key])} {${styleArr[key]}}`
  }
  // console.log(newStyleNameArr)
  return newStyleNameArr
}
module.exports = styleHandle