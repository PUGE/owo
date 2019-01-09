'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const Templet = require('../templet')
const Style = require('./style')
const Script = require('./script')

const templePath = './src/temple/'

let styleText = ''

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
function getAndRemoveAttr (el, name) {
  const value = el.attributes.getNamedItem(name).value
  el.attributes.removeNamedItem(name)
  return value
}

// 解析v-for
function parseFor (exp) {
  const stripParensRE = /^\(|\)$/g
  const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
  const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
  var inMatch = exp.match(forAliasRE)
  if (!inMatch) { return }
  var res = {};
  res.for = inMatch[2].trim();
  var alias = inMatch[1].trim().replace(stripParensRE, '');
  var iteratorMatch = alias.match(forIteratorRE);
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim();
    res.iterator1 = iteratorMatch[1].trim();
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim();
    }
  } else {
    res.alias = alias;
  }
  return res
}


function funHandle (dom, bodyName, data) {
  // console.log(body.children[0].innerHTML)
  // console.log(dom.attributes)
  if (dom.tagName === 'TEMPLE') {
    // console.log(`${templePath}${dom.attributes.getNamedItem('name').value}.temple`)
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
      // ------------------------------------------------ @click 处理 ------------------------------------------------
      if (attribute.name === 'v-for') {
        const attributeValue = getAndRemoveAttr(dom, 'v-for')
        const loopInfo = parseFor(attributeValue)
        // console.log(dom.outerHTML)
        let newHtml = ''
        // console.log(parseFor(attributeValue))
        
        const replaceList = Templet.cutStringArray(dom.outerHTML, '{{', '}}')
        // 遍历目标data
        // console.log(data[loopInfo["for"]])
        let index = 0
        for (let key in data[loopInfo["for"]]) {
          const value = data[loopInfo["for"]][key]
          let temple = dom.outerHTML
          for (let replaceInd = 0; replaceInd < replaceList.length; replaceInd++) {
            const replaceValue = replaceList[replaceInd]
            if (!replaceValue) continue
            if (loopInfo.iterator1 === replaceValue) {
              temple = temple.replace(`{{${replaceValue}}}`, key)
            } else if (loopInfo.iterator2 === replaceValue) {
              temple = temple.replace(`{{${replaceValue}}}`, index)
            } else {
              const newValue = new Function(`const ${loopInfo.alias} = ${fnStringify(value)}; return ${replaceValue}`)()
              temple = temple.replace(`{{${replaceValue}}}`, newValue)
            }
          }
          newHtml += temple
          index++
        }
        dom.outerHTML = newHtml
      }
    }
  }
  // 递归处理DOM节点下面的子节点
  for (var i = 0; i < dom.children.length; i++) {
    funHandle(dom.children[i], bodyName, data)
  }
}


// 对象转字符串
function fnStringify (obj) {
  const objType = obj.constructor
  let newObj = ''
  if (objType === Array) {
    newObj += '['
  } else if (objType === Object) {
    newObj += '{'
  }
  for (let key in obj) {
    // 前缀
    const prefix = objType === Object ? `${key}:` : ``
    // console.log(obj[key].constructor)
    // 获取值类型
    switch (obj[key].constructor) {
      case Function: {
        let fnStr = JSON.stringify(obj[key] + '')
        fnStr = fnStr.substring(1, fnStr.length - 1)
        fnStr = fnStr.replace(/\\"/g, '"')
        newObj += `${prefix}${fnStr},`
        break
      }
      case Array: {
        newObj +=  `${prefix}${fnStringify(obj[key])},`
        break
      }
      case Object: {
        newObj +=  `${prefix}${fnStringify(obj[key])},`
        break
      }
      default: {
        newObj += `${prefix}"${obj[key]}",`
        break
      }
    }
  }
  newObj = newObj.substring(0, newObj.length - 1)
  if (objType === Array) {
    newObj += ']'
  } else if (objType === Object) {
    newObj += '}'
  }
  return newObj
}

// 处理Heard
function bodyHandle (bodyPath, htmlText) {
  
  let scriptData = {}
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
      const scriptCode = eval(Script(headFileContent).code)
      scriptData[bodyName] = scriptCode
      
      // 解析出Body内容
      let headContent = Templet.cutString(headFileContent, '<template>', '</template>')

      // 将文本转化为DOM元素
      const document = new JSDOM(headContent).window.document
      let body = document.body

      // DOM特殊标签处理
      funHandle(body, bodyName, scriptCode.data)

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
      // console.log(Style(headFileContent, bodyName))
      styleText += Style(headFileContent, bodyName)
      
    } else {
      console.error(`heard模板:${bodyFilePath}不存在!`)
    }
  })

  return {
    html: htmlText,
    style: styleText,
    script: `
      window.ozzx.script = ${fnStringify(scriptData)}
    `
  }
}
module.exports = bodyHandle