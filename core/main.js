'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const Templet = require('../templet')
const Style = require('./style')
const Script = require('./script')

let styleText = ''
let scriptData = {}

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

// 处理v-for
function handleFor (dom, scriptData) {
  const attributeValue = getAndRemoveAttr(dom, 'v-for')
  const loopInfo = parseFor(attributeValue)
  // console.log(dom.outerHTML)
  let newHtml = ''
  // console.log(parseFor(attributeValue))
  let temple = dom.outerHTML
  const replaceList = Templet.cutStringArray(dom.outerHTML, '{{', '}}')
  // 判断是否为循环数字
  if (/^[0-9]+$/.test(loopInfo["for"])) {
    for (let i = 0; i < parseInt(loopInfo["for"]); i++) {
      for (let replaceInd = 0; replaceInd < replaceList.length; replaceInd++) {
        temple = temple.replace(`{{${replaceValue}}}`, i)
      }
      newHtml += temple
    }
  } else {
    let index = 0
    
    for (let key in scriptData[loopInfo["for"]]) {
      const value = scriptData[loopInfo["for"]][key]
      let copyTemple = temple
      for (let replaceInd = 0; replaceInd < replaceList.length; replaceInd++) {
        
        const replaceValue = replaceList[replaceInd]
        
        if (!replaceValue) continue
        if (loopInfo.iterator1 === replaceValue) {
          copyTemple = copyTemple.replace(`{{${replaceValue}}}`, key)
        } else if (loopInfo.iterator2 === replaceValue) {
          copyTemple = copyTemple.replace(`{{${replaceValue}}}`, index)
        } else {
          const newValue = new Function(`const ${loopInfo.alias} = ${fnStringify(value)}; return ${replaceValue}`)()
          copyTemple = copyTemple.replace(`{{${replaceValue}}}`, newValue)
        }
        
      }
      newHtml += copyTemple
      index++
    }
  }
  dom.outerHTML = newHtml
}


function funHandle (dom, bodyName, scriptData, packConfig, templateName) {
  // console.log(body.children[0].innerHTML)
  // console.log(dom.attributes)
  if (dom.tagName === 'TEMPLE') {
    // console.log(dom.outerHTML)
    // 处理模板
    dom.outerHTML = bodyHandle(bodyName, dom.outerHTML, packConfig, dom.attributes.getNamedItem('name').value)
    return
  }
  if (dom.attributes.length > 0) {
    const attributes = dom.attributes
    // 读取DOM的每一个属性
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i]
      // ------------------------------------------------ @click 处理 ------------------------------------------------
      if (attribute.name === 'v-for') {
        dom.outerHTML = handleFor(dom, scriptData.data)
      } else if (attribute.name === '@click') {
        // 判断是否为模板
        if (templateName !== '') {
          dom.setAttribute('template', templateName)
        }
      }
    }
  }
  // 递归处理DOM节点下面的子节点
  for (var i = 0; i < dom.children.length; i++) {
    funHandle(dom.children[i], bodyName, scriptData, packConfig, templateName)
  }
}


// 对象转字符串
function fnStringify (obj) {
  const objType = obj.constructor
  console.log(obj)
  console.log(objType)
  let newObj = ''
  if (objType === Array) {
    newObj += '['
  } else if (objType === Object) {
    newObj += '{'
  }
  let needRemoveCommas = false
  for (let key in obj) {
    needRemoveCommas = true
    const value = obj[key]
    // 前缀
    const prefix = objType === Object ? `${key}:` : ``
    // console.log(obj[key].constructor)
    // 获取值类型
    if (value === null) newObj += `${prefix}null,`
    switch (value.constructor) {
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
  // 去除尾部逗号,如果传入为空对象则不需要进行操作
  if (needRemoveCommas) {
    newObj = newObj.substring(0, newObj.length - 1)
  }
  if (objType === Array) {
    newObj += ']'
  } else if (objType === Object) {
    newObj += '}'
  }
  return newObj
}

// 处理模板
function bodyHandle (bodyName, htmlText, packConfig, templateName) {
  
  // 判断body模板目录中是否有指定heard
  const bodyFilePath = `${process.cwd()}${packConfig.root}/${packConfig.pageFolder}/${templateName}.page`
  // 判断page文件是否存在
  if (fs.existsSync(bodyFilePath)) {
    // 读取出模板文件内容
    const headFileContent = fs.readFileSync(bodyFilePath, 'utf8')

    // 读取出js内容
    let scriptCode = null
    const script = Script(headFileContent)
    if (script) {
      scriptCode = eval(script.code)
      // 模板还是页面处理
      if (templateName === bodyName) {
        scriptData[bodyName] = scriptCode
      } else {
        if (scriptData[bodyName].template === undefined) scriptData[bodyName].template = {}
        // console.log(scriptData[bodyName].template)
        scriptData[bodyName].template[templateName] = scriptCode
        // console.log(scriptData[bodyName].template)
      }
    }
    // 解析出Body内容
    let headContent = Templet.cutString(headFileContent, '<template>', '</template>')

    // 将文本转化为DOM元素
    const document = new JSDOM(headContent).window.document
    let body = document.body

    // DOM特殊标签处理
    funHandle(body, bodyName, scriptCode, packConfig, templateName === bodyName ? '' : templateName)
    

    // 给元素增加页面专属的class和id
    const domBox = document.createElement("div")
    domBox.classList.add(`ox`)
    domBox.classList.add(`ox-${templateName}`)
    if (templateName === bodyName) {
      // console.log(bodyName, templateName)
      domBox.setAttribute('id', `ox-${bodyName}`)
      domBox.style.display = 'none'
    }
    domBox.innerHTML = body.children[0].outerHTML

    headContent = domBox.outerHTML
    // 模板替换
    // console.log(`<temple name="${bodyName}"></temple>`)
    htmlText = htmlText.replace(`<temple name="${templateName}"></temple>`, headContent)
    // console.log(htmlText)
    // 解析样式
    styleText += Style(headFileContent, bodyName)
    
  } else {
    console.error(`heard模板:${bodyFilePath}不存在!`)
  }
  return htmlText
}

// 处理Heard
function pageHandle (htmlText, packConfig) {
  
  scriptData = {}
  // 清空style
  styleText = ''
  // 取出所有Body标识
  const bodyTempletArr = Templet.cutStringArray(htmlText, "<!-- *body-", "* -->")
  bodyTempletArr.forEach(bodyName => {
    htmlText = bodyHandle(bodyName, htmlText, packConfig, bodyName)
  })
  return {
    html: htmlText,
    style: styleText,
    script: `
      window.ozzx.script = ${fnStringify(scriptData)}
    `
  }
}
module.exports = pageHandle