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

const Cut = require('../cut')
const Style = require('./style')


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
  const attributeValue = getAndRemoveAttr(dom, '@for')
  
  const loopInfo = parseFor(attributeValue)
  // console.log(dom.outerHTML)
  let newHtml = ''
  // console.log(parseFor(attributeValue))
  
  const replaceList = Cut.stringArray(dom.outerHTML, '{{', '}}')
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


function funHandle (dom, pageName, scriptData, templateName, sourceText, pageInfo) {
  // 模板处理
  if (dom.tagName === 'TEMPLE') {
    const templeValue = dom.attributes.getNamedItem('src').value
    logger.debug(`handle temple ${templeValue}`)
    // 处理模板
    dom.outerHTML = htmlTextHandle(dom.outerHTML, {
      src: dom.attributes.getNamedItem('src').value,
      name: dom.attributes.getNamedItem('name').value,
      pageName: pageInfo.name,
      temple: dom.outerHTML
    })
    return
  }
  // a标签处理
  if (dom.tagName === 'A') {
    // logger.debug(dom.hash)
    const hashList = dom.hash.split('&')
    hashList.forEach(element => {
      // 判断使用了那些特效
      if (element.startsWith('in=')) {
        const animationText = Cut.string(element, 'in=')
        const animationList = animationText.split(',')
        animationList.forEach(animationName => {
          if (!useAnimationList.includes(animationName)) {
            useAnimationList.push(animationName)
          }
        })
        // console.log(animationText)
      }
      if (element.startsWith('out=')) {
        const animationText = Cut.string(element, 'out=')
        const animationList = animationText.split(',')
        animationList.forEach(animationName => {
          if (!useAnimationList.includes(animationName)) {
            useAnimationList.push(animationName)
          }
        })
        // console.log(animationText)
      }
    })
  }
  if (dom.attributes.length > 0) {
    const attributes = dom.attributes
    // 读取DOM的每一个属性
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i]
      // ------------------------------------------------ @click 处理 ------------------------------------------------
      if (attribute.name === '@for') {
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
    funHandle(dom.children[i], pageName, scriptData, templateName, sourceText, pageInfo)
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
        fnStr = fnStr.replace(/\\r\\n/g, '\r\n')
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
function getFileContent (pageInfo) {
  let headFileContent = ''
  // 判断是否为网路地址
  if (pageInfo.src.startsWith('http')) {
    headFileContent = request(pageInfo.src).data.toString()
  } else {
    // body目录
    const bodyFilePath = path.join(process.cwd(), pageInfo.src)
    // console.log(bodyFilePath)
    if (fs.existsSync(bodyFilePath)) {
      headFileContent = fs.readFileSync(bodyFilePath, 'utf8')
    } else {
      logger.error(`heard模板:${bodyFilePath}不存在!`)
    }
  }
  return headFileContent
}


/**
 * 对文本格式的模板进行处理
 *
 * @param {string} newPageName 页面的名称
 * @param {string} htmlText 模板内容
 * @param {Object} templateName 模板名称
 * @return {Object} 返回值描述
 */
function htmlTextHandle (htmlText, pageInfo) {
  // 模板文件内容
  let headFileContent = getFileContent(pageInfo)
  // console.log(headFileContent)
  
  // 读取出js内容
  let scriptCode = null
  // const script = Script(headFileContent)
  // console.log(htmlText)
  const scriptText = Cut.string(headFileContent, "<script>", "</script>")
  // console.log(scriptText)
  // 如果页面没有js也为其创建一个空对象
  if (scriptText) {
    scriptCode = eval(scriptText)
    // console.log(scriptCode)
    // 模板还是页面处理
    // console.log(templateName, pageName)
    if (pageInfo.isPage) {
      scriptData[pageInfo.name] = scriptCode
    } else {
      // 判断模板是否包含created事件
      if (scriptData[pageInfo.pageName].template === undefined) scriptData[pageInfo.pageName].template = {}
      scriptData[pageInfo.pageName].template[pageInfo.name] = scriptCode
    }
  } else {
    scriptData[pageInfo.name] = {}
  }
  // 解析出Body内容
  let headContent = Cut.string(headFileContent, '<template>', '</template>')
  // 将文本转化为DOM元素
  // console.log(headContent)
  const document = new JSDOM(headContent).window.document
  let body = document.body

  // DOM特殊标签处理
  funHandle(body, pageInfo.name, scriptCode, pageInfo.isPage ? '' : pageInfo.name, pageInfo.temple, pageInfo)
  

  // 给元素增加页面专属的class和id
  const domBox = document.createElement("div")
  domBox.classList.add(`ox-${pageInfo.name}`)
  // 如果是页面则为其加上id和class
  if (pageInfo.isPage) {
    // console.log(pageName, newTemplateName)
    domBox.classList.add(`ox`)
    domBox.setAttribute('id', `ox-${pageInfo.name}`)
    // 单页面不需要设置隐藏
    if (Config.pageList.length !== 1) {
      domBox.style.display = 'none'
    }
  }
  // 判断文件body是否为空
  if (body.children.length === 0) {
    logger.error(`template body is empty!`)
    return htmlText
  } else {
    domBox.innerHTML = body.innerHTML
    headContent = domBox.outerHTML
    // 模板替换
    htmlText = htmlText.replace(pageInfo.temple, headContent)
  }
  
  // 解析样式
  styleText += Style(headFileContent, pageInfo.name)
  return htmlText
}

/**
 * 解析Html
 *
 * @param {string} htmlText html文本
 * @param {string} packConfig 打包配置
 * @return {Object} 解析完成的数据
 */
function pageHandle (templet, config) {
  // 全局变量初始化
  [scriptData, styleText, serverTempletMap, Config] = [{}, '', {}, config]
  
  // 将配置中的Script列表插入到dom中
  let templeData = `<!-- 页面区域 -->`
  for (let ind = 0; ind < config.pageList.length; ind++) {
    const element = config.pageList[ind]
    const templeTemp = `<temple name="${element.name}" src="${element.src}" isPage="true"></temple>`
    templeData += `\r\n    ${templeTemp}`
    config.pageList[ind].temple = templeTemp
  }
  // console.log(templet)
  templet = templet.replace('<!-- page-output -->', templeData)
  
  // 处理每一个模板
  config.pageList.forEach(pageInfo => {
    templet = htmlTextHandle(templet, pageInfo)
  })
  return {
    html: templet,
    style: styleText,
    script: `
      window.ozzx = {
        script: ${fnStringify(scriptData)},
        tool: {},
        entry: "${Config.entry}",
        state: {}
      };
      // 便捷的获取工具方法
      var $tool = ozzx.tool
      var $data = {}
    `,
    serverTempletMap,
    useAnimationList: useAnimationList
  }
}
module.exports = pageHandle