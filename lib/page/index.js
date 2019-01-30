'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const path = require('path')

// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

// 同步请求
const request = require('urllib-sync').request

const Templet = require('../templet')
const Style = require('./style')
const Script = require('./script')

let styleText = ''
let scriptData = {}

// 存储网络模板映射关系
let serverTempletMap = {}
let useAnimationList = []

// 全局配置项
let Config = {}

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
  
  const replaceList = Templet.cutStringArray(dom.outerHTML, '{{', '}}')
  // 判断是否为循环数字
  if (/^[0-9]+$/.test(loopInfo["for"])) {
    for (let i = 0; i < parseInt(loopInfo["for"]); i++) {
      let temple = dom.outerHTML
      for (let replaceInd = 0; replaceInd < replaceList.length; replaceInd++) {
        temple = temple.replace(`{{${loopInfo['alias']}}}`, i)
      }
      newHtml += temple
    }
  } else {
    let index = 0
    for (let key in scriptData[loopInfo["for"]]) {
      const value = scriptData[loopInfo["for"]][key]
      let copyTemple = dom.outerHTML
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


function funHandle (dom, pageName, scriptData, templateName) {
  // 模板处理
  if (dom.tagName === 'TEMPLE') {
    // 处理模板
    dom.outerHTML = htmlTextHandle(pageName, dom.outerHTML, dom.attributes.getNamedItem('name').value)
    return
  }
  // a标签处理
  if (dom.tagName === 'A') {
    logger.debug(dom.hash)
    const hashList = dom.hash.split('&')
    hashList.forEach(element => {
      // 判断使用了那些特效
      if (element.startsWith('in=')) {
        const animationText = Templet.cutString(element, 'in=')
        const animationList = animationText.split(',')
        animationList.forEach(animationName => {
          if (!useAnimationList.includes(animationName)) {
            useAnimationList.push(animationName)
          }
        })
        console.log(animationText)
      }
      if (element.startsWith('out=')) {
        const animationText = Templet.cutString(element, 'out=')
        const animationList = animationText.split(',')
        animationList.forEach(animationName => {
          if (!useAnimationList.includes(animationName)) {
            useAnimationList.push(animationName)
          }
        })
        console.log(animationText)
      }
    })
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
    funHandle(dom.children[i], pageName, scriptData, templateName)
  }
}


// 对象转字符串
function fnStringify (obj) {
  const objType = obj.constructor
  // console.log(obj)
  // console.log(objType)
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
    const prefix = objType === Object ? `"${key}":` : ``
    
    // 获取值类型
    if (value === null) {
      newObj += `${prefix}null,`
      continue
    }
    if (value === undefined) continue
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
      case Number: {
        newObj += `${prefix}${obj[key]},`
        break
      }
      case Boolean: {
        // console.log(obj[key])
        newObj += `${prefix}${obj[key]},`
        break
      }
      default: {
        newObj += `${prefix}"${obj[key]}",`
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
  // console.log(newObj)
  return newObj
}


/**
 * 对文本格式的模板进行处理
 *
 * @param {Object} templateName 模板名称/路径/网络地址
 * @return {Object} 返回值描述
 */
function getFileContent (pageName, templateName, htmlText) {
  let headFileContent = ''
  // 判断是否为网路地址
  if (templateName.startsWith('http')) {
    headFileContent = request(templateName).data.toString()
    const serverTempletName = `servertemple${Object.getOwnPropertyNames(serverTempletMap).length}`
    // 如果是网络模板则为他们重新命名
    if (pageName === templateName) {
      pageName = serverTempletName
    }
    htmlText = htmlText.replace(`<temple name="${templateName}"></temple>`, `<temple name="${serverTempletName}"></temple>`)
    // 记录下这个对应关系
    serverTempletMap[serverTempletName] = templateName
    templateName = serverTempletName
  } else {
    // body目录
    const bodyFilePath = path.join(process.cwd(), Config.root, Config.pageFolder, `${templateName}.page`)
    // console.log(bodyFilePath)
    if (fs.existsSync(bodyFilePath)) {
      headFileContent = fs.readFileSync(bodyFilePath, 'utf8')
    } else {
      logger.error(`heard模板:${bodyFilePath}不存在!`)
    }
  }
  return [pageName, templateName, headFileContent, htmlText]
}


/**
 * 对文本格式的模板进行处理
 *
 * @param {string} newPageName 页面的名称
 * @param {string} htmlText 模板内容
 * @param {Object} templateName 模板名称
 * @return {Object} 返回值描述
 */
function htmlTextHandle (pageName, htmlText, templateName) {
  // 模板文件内容
  let [newPageName, newTemplateName, headFileContent, newHtmlText] = getFileContent(pageName, templateName, htmlText)
  
  
  // 读取出js内容
  let scriptCode = null
  const script = Script(headFileContent)
  // 如果页面没有js也为其创建一个空对象
  if (script) {
    scriptCode = eval(script.code)
    // 模板还是页面处理
    // console.log(templateName, pageName)
    if (newTemplateName === newPageName) {
      scriptData[newPageName] = scriptCode
    } else {
      // 判断模板是否包含created事件
      if (scriptData[newPageName].template === undefined) scriptData[newPageName].template = {}
      scriptData[newPageName].template[newTemplateName] = scriptCode
    }
  } else {
    scriptData[newTemplateName] = {}
  }
  // 解析出Body内容
  let headContent = Templet.cutString(headFileContent, '<template>', '</template>')
  // 将文本转化为DOM元素
  const document = new JSDOM(headContent).window.document
  let body = document.body

  // DOM特殊标签处理
  funHandle(body, newPageName, scriptCode, newTemplateName === newPageName ? '' : newTemplateName)
  

  // 给元素增加页面专属的class和id
  const domBox = document.createElement("div")
  domBox.classList.add(`ox-${newTemplateName}`)
  // 如果是页面则为其加上id和class
  if (newTemplateName === newPageName) {
    // console.log(pageName, newTemplateName)
    domBox.classList.add(`ox`)
    domBox.setAttribute('id', `ox-${newPageName}`)
    // 单页面不需要设置隐藏
    if (!Config.isOnePage) {
      domBox.style.display = 'none'
    }
  }
  // 判断文件body是否为空
  if (body.children.length === 0) {
    logger.error(`template body is empty!`)
    return newHtmlText
  } else {
    domBox.innerHTML = body.innerHTML
    headContent = domBox.outerHTML
    // 模板替换
    newHtmlText = newHtmlText.replace(`<temple name="${newTemplateName}"></temple>`, headContent)
  }
  
  // 解析样式
  styleText += Style(headFileContent, newPageName)
  return newHtmlText
}

/**
 * 解析Html
 *
 * @param {string} htmlText html文本
 * @param {string} packConfig 打包配置
 * @return {Object} 解析完成的数据
 */
function pageHandle (htmlText, packConfig) {
  // 全局变量初始化
  [scriptData, styleText, serverTempletMap, Config] = [{}, '', {}, packConfig]
  // 取出所有Body标识
  const bodyTempletArr = Templet.cutStringArray(htmlText, '<temple', '</temple>')
  // 判断是否为单页面
  Config.isOnePage = bodyTempletArr.length === 1 ? true : false
  // 处理每一个模板
  bodyTempletArr.forEach(templeText => {
    // .attributes.getNamedItem('name').value
    // 尝试解析标签
    const templetDom = new JSDOM(`<temple${templeText}"</temple>`).window.document.body.children[0]
    const templetName = templetDom.attributes.getNamedItem('name').value
    // console.log(document)
    htmlText = htmlTextHandle(templetName, htmlText, templetName)
  })
  return {
    html: htmlText,
    style: styleText,
    script: `
      window.ozzx = {
        script: {}
      };
      var globalConfig = ${JSON.stringify(Config)};
      window.ozzx.script = ${fnStringify(scriptData)}
    `,
    isOnePage: Config.isOnePage,
    serverTempletMap,
    useAnimationList: useAnimationList
  }
}
module.exports = pageHandle