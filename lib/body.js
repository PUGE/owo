
const fs = require('fs')
const Templet = require('./templet')
const Style = require('./style')

// 处理Heard
function bodyHandle (bodyPath, htmlText) {
  let styleText = ''
  // 取出所有Body标识
  bodyTempletArr = Templet.cutStringArray(htmlText, "<!-- *body-", "* -->")
  bodyTempletArr.forEach(bodyName => {
    // 判断body模板目录中是否有指定heard
    const bodyFilePath = `${bodyPath}${bodyName}.page`
    // console.log(bodyFilePath)
    if (fs.existsSync(bodyFilePath)) {
      // 读取出Body模板内容
      const headFileContent = fs.readFileSync(bodyFilePath, 'utf8')
      // 解析出Body内容
      let headContent = Templet.cutString(headFileContent, '<template>', '</template>')
      // 为模板内容创建独立的DOM块
      headContent = `<div class="page-class-${bodyName}" id="page-id-${bodyName}">${headContent}</div>`
      htmlText = htmlText.replace(`<!-- *body-${bodyName}* -->`, headContent)
      // 解析样式
      
      Style(headFileContent, bodyName).forEach(element => {
        styleText += `${element}\n\r`
      })
    } else {
      console.error(`heard模板:${bodyFilePath}不存在!`)
    }
  })
  // console.log(styleText)
  return {
    html: htmlText,
    style: styleText
  }
}
module.exports = bodyHandle