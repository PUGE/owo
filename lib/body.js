
const fs = require('fs')
const Templet = require('./templet')

// 处理Heard
function bodyHandle (bodyPath, htmlText) {
  // 取出所有Body标识
  heardTempletArr = Templet.cutStringArray(htmlText, "<!-- *body-", "* -->")
  heardTempletArr.forEach(element => {
    // 判断body模板目录中是否有指定heard
    const bodyFilePath = `${bodyPath}${element}.html`
    console.log(bodyFilePath)
    if (fs.existsSync(bodyFilePath)) {
      // 读取出Body模板内容
      const headFileContent = fs.readFileSync(bodyFilePath, 'utf8')
      // 解析出Body内容
      const headContent = Templet.cutString(headFileContent, '<body>', '</body>')
      htmlText = htmlText.replace(`<!-- *body-${element}* -->`, headContent)
    } else {
      console.error(`heard模板:${bodyFilePath}不存在!`)
    }
  })
  return htmlText
}
module.exports = bodyHandle