'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const Templet = require('./templet')
const Style = require('./style')
const Script = require('./script')

const templePath = './src/temple/'

let styleText = ''

function funHandle (dom, bodyName, data) {
  // console.log(body.children[0].innerHTML)
  // console.log(dom.attributes)
  if (dom.tagName === 'TEMPLE') {
    console.log(`${templePath}${dom.attributes.getNamedItem('name').value}.temple`)
    const templeFile = fs.readFileSync(`${templePath}${dom.attributes.getNamedItem('name').value}.temple`, 'utf8')
    const templeDom = Templet.cutString(templeFile, '<template>', '</template>')
    dom.outerHTML = templeDom
    // 解析样式
    styleText += Style(templeFile, bodyName)
  }
  if (dom.attributes.length > 0) {
    const attributes = dom.attributes
    // 读取DOM的每一个属性
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i]
      const value = attribute.value
      // ------------------------------------------------ @click 处理 ------------------------------------------------
      if (attribute.name === "@click") {
        // 创建属性
        attributes.removeNamedItem('@click')
        dom.setAttribute('onclick', `pgClick({name: '${bodyName}', methodName: '${value}', dom: this})`)
      } else if (attribute.name === 'k-for') {
        // console.log(dom.outerHTML)
        let newHtml = ''
        dom.attributes.removeNamedItem('k-for')
        const replaceList = Templet.cutStringArray(dom.outerHTML, '{{', '}}')
        data[value].forEach(element => {
          let temple = dom.outerHTML
          replaceList.forEach(replaceItem => {
            temple = temple.replace(`{{${replaceItem}}}`, element[replaceItem])
          })
          newHtml += temple
        })
        dom.outerHTML = newHtml
      }
    }
  }
  // 递归处理DOM节点下面的子节点
  for (var i = 0; i < dom.children.length; i++) {
    funHandle(dom.children[i], bodyName, data)
  }
}


// 处理Heard
function bodyHandle (bodyPath, htmlText) {
  
  let scriptData = ''
  // 取出所有Body标识
  const bodyTempletArr = Templet.cutStringArray(htmlText, "<!-- *body-", "* -->")
  bodyTempletArr.forEach(bodyName => {
    // 判断body模板目录中是否有指定heard
    const bodyFilePath = `${bodyPath}${bodyName}.page`
    // 判断page文件是否存在
    if (fs.existsSync(bodyFilePath)) {
      // 读取出模板文件内容
      const headFileContent = fs.readFileSync(bodyFilePath, 'utf8')

      // 读取出js内容
      const scriptText = Script(headFileContent)
      if (scriptText) {
        scriptData += `
          window.ozzx.script.${bodyName} = ${scriptText}
        `
      }
      // 待解决
      // 解析出data内容
      let dataJson = {
        imageList: [
          {url: "./image/1.png", explain: "图片说明图片说明"},
          {url: "./image/2.png", explain: "图片说明图片说明"},
          {url: "./image/3.png", explain: "图片说明图片说明"}
        ]
      }
      
      // 解析出Body内容
      let headContent = Templet.cutString(headFileContent, '<template>', '</template>')

      // 将文本转化为DOM元素
      const document = new JSDOM(headContent).window.document
      let body = document.body

      // DOM特殊标签处理
      funHandle(body, bodyName, dataJson)

      // 给元素增加页面专属的class和id
      const domBox = document.createElement("div")
      domBox.classList.add(`ox`)
      domBox.classList.add(`ox-${bodyName}`)
      domBox.setAttribute('id', `ox-${bodyName}`)
      domBox.style.display = 'none'
      domBox.innerHTML = body.children[0].outerHTML

      headContent = domBox.outerHTML
      // 模板替换
      htmlText = htmlText.replace(`<!-- *body-${bodyName}* -->`, headContent)
      
      // 解析样式
      console.log(Style(headFileContent, bodyName))
      styleText += Style(headFileContent, bodyName)
      
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