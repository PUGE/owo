'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const Templet = require('./templet')
const Style = require('./style')
const Script = require('./script')



// 处理Heard
function bodyHandle (bodyPath, htmlText) {
  let styleText = ''
  let scriptData = ''
  // 取出所有Body标识
  const bodyTempletArr = Templet.cutStringArray(htmlText, "<!-- *body-", "* -->")
  bodyTempletArr.forEach(bodyName => {
    // 判断body模板目录中是否有指定heard
    const bodyFilePath = `${bodyPath}${bodyName}.page`
    // console.log(bodyFilePath)
    if (fs.existsSync(bodyFilePath)) {
      // 读取出Body模板内容
      const headFileContent = fs.readFileSync(bodyFilePath, 'utf8')
      // 解析出Body内容
      let headContent = Templet.cutString(headFileContent, '<template>', '</template>')

      // 将文本转化为DOM元素
      const document = new JSDOM(headContent).window.document
      let body = document.body
      console.log(body.children[0].innerHTML)
      const attributes = body.children[0].attributes
      for (let i = 0; i < attributes.length; i++) {
        const attribute = attributes[i]
        const method = attribute.value
        // 处理点击事件
        if (attribute.name === "@click") {
          // 创建属性
          let tempDom = document.createAttribute("onclick");
          tempDom.nodeValue = `pgClick({name: '${bodyName}', methodName: '${method}', dom: this})`
          // console.log(attributes.removeNamedItem)
          attributes.removeNamedItem('@click')
          attributes.setNamedItem(tempDom)
        }
      }
      headContent = body.innerHTML

      // 为模板内容创建独立的DOM块
      headContent = `<div class="page-class-${bodyName}" id="page-id-${bodyName}" style="display: none">${headContent}</div>`
      htmlText = htmlText.replace(`<!-- *body-${bodyName}* -->`, headContent)
      // 解析样式
      
      Style(headFileContent, bodyName).forEach(element => {
        styleText += `${element}\n\r`
      })

      const scriptText = Script(headFileContent)
      if (scriptText) {
        scriptData += `
          window.PG.script.${bodyName} = ${scriptText}
        `
      }
      
    } else {
      console.error(`heard模板:${bodyFilePath}不存在!`)
    }
  })
  // console.log(styleText)
  return {
    html: htmlText,
    style: styleText,
    script: scriptData
  }
}
module.exports = bodyHandle