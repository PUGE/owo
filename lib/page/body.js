'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

// 加解密
const crypto = require('crypto')

const path = require('path')

// 日志输出
// 配置输出插件
const log = require('../log')()
const Tool = require('../tool')
// 同步请求
const request = require('urllib-sync').request

const Cut = require('../cut')
const Style = require('./style')

// 事件处理
const forEvent = require('./event/for')

let styleText = ''
let scriptData = {}

// 存储网络模板映射关系
let serverTempletMap = {}
let useAnimationList = new Set()

// 全局配置项
let Config = {}

// 模板缓存 作用: 1.已经处理过的模板不需要进行二次处理 2.不重复打包模板css、js
let templeTempList = {}

// 需要做特殊处理的css列表
let needReplaceCssList = []



function funHandle (dom, scriptData, pageInfo) {
  const pageName = pageInfo.name || pageInfo.attributes.name
  // 模板处理
  if (dom.tagName === 'TEMPLE') {
    // console.log(pageInfo)
    // console.log('---------')
    // 取出模板属性列表列表
    let attributes = {}
    for (let ind = 0; ind < dom.attributes.length; ind++) {
      const nodeName = dom.attributes[ind].nodeName
      const value = dom.attributes[ind].value
      attributes[nodeName] = value
    }
    // 处理模板
    dom.outerHTML = htmlTextHandle({
      attributes: attributes,
      // 页面名称
      pageName: pageInfo.pageName || pageName,
      // 待优化， 应该使用一个
      temple: dom.outerHTML,
      outerHTML: dom.outerHTML,
      // 内部html
      innerHTML: dom.innerHTML
    }, true)
    return
  } else if (dom.tagName === 'SLOT') {
    // console.log(dom.outerHTML, pageInfo.innerHTML)
    // 如果是插口，取出模板内的html替换
    dom.outerHTML = pageInfo.innerHTML
  }

  if (dom.attributes.length > 0) {
    const attributes = dom.attributes
    // 待优化不
    // 读取DOM的每一个属性
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i]
      // ------------------------------------------------ @click 处理 ------------------------------------------------
      if (attribute.name === '@for') {
        // 待优化 如果data中没有对应的 会报错
        dom.outerHTML = forEvent(dom, scriptData)
      }
    }
  }
  // 递归处理DOM节点下面的子节点
  for (var i = 0; i < dom.children.length; i++) {
    funHandle(dom.children[i], scriptData, pageInfo)
  }
}


/**
 * 对文本格式的模板进行处理
 *
 * @param {Object} templateName 模板名称/路径/网络地址
 * @return {Object} 返回值描述
 */
function getFileContent (pageInfo) {
  const pageSrc = pageInfo.src || pageInfo.attributes.src
  let headFileContent = ''
  // 判断是否为网路地址
  if (pageSrc.startsWith('http')) {
    log.debug(`开始获取网络模板:${pageSrc}`)
    headFileContent = request(pageSrc).data.toString()
  } else {
    // body目录
    const bodyFilePath = path.join(process.cwd(), pageSrc)
    // console.log(bodyFilePath)
    if (fs.existsSync(bodyFilePath)) {
      headFileContent = fs.readFileSync(bodyFilePath, 'utf8')
    } else {
      log.error(`模板: ${bodyFilePath}不存在!`)
    }
  }
  return headFileContent
}


/**
 * 对文本格式的模板进行处理
 *
 * @param {string} newPageName 页面的名称
 * @param {Object} templateName 模板名称
 * @return {Object} 返回值描述
 */
function htmlTextHandle (pageInfo, isTemple) {
  const pageName = pageInfo.name || pageInfo.attributes.name
  const pageSrc = pageInfo.src || pageInfo.attributes.src
  // 获取模板的html文本
  let htmlText = pageInfo.outerHTML
  // 模板参数完全一致的才算是同一个模板
  const hash = crypto.createHash('md5').update(htmlText.replace(/ /g, '')).digest('hex')
  // console.log(hash)
  // 判断缓存中是否有此模板,有的话不需要重新计算
  if (templeTempList[hash]) {
    log.debug(`使用缓存返回模板: ${pageSrc}`)
    return templeTempList[hash]
  }
  log.debug(`处理模板: ${pageSrc}`)
  // 模板文件内容
  let headFileContent = getFileContent(pageInfo)
  
  // 取出页面中的js内容
  let scriptCode = null
  const scriptText = Cut.string(headFileContent, "<script>", "</script>")
  // console.log(scriptText)
  // 如果页面没有js也为其创建一个空对象
  if (scriptText) {
    scriptCode = eval(scriptText)
    if (pageInfo.isPage) {
      scriptData[pageName] = scriptCode
    } else {
      // console.log(scriptData, pageInfo, isTemple)
      // 判断模板是否包含created事件
      // 判断是否为模板
      if (scriptData[pageInfo.pageName].template === undefined) scriptData[pageInfo.pageName].template = {}
      scriptData[pageInfo.pageName].template[pageName] = scriptCode
      // 填入模板属性
      scriptData[pageInfo.pageName].template[pageName].prop = pageInfo.attributes
    }
  } else {
    scriptData[pageName] = {}
  }
  // 判断是否需要使用插件预处理
  const bodyLabel = Cut.string(headFileContent, "<template", ">")
  const lang = Cut.string(bodyLabel, 'lang="', '"')

  // 解析出Body内容
  let bodyContent = Cut.string(headFileContent, headFileContent.match(/<template.*?>/), "</template>")

  // 判断是否需要使用pug插件
  if (lang === 'pug') {
    const pugPath = path.join(process.cwd(), 'node_modules', 'pug')
     // 判断是否安装了pug
     if (!fs.existsSync(pugPath)) {
      throw '请使用 npm i -save pug 或 yarn add pug 安装pug模块!'
    }
    const pugRender = require(pugPath)
    bodyContent = pugRender.compile(bodyContent)()

  }
  // 将文本转化为DOM元素
  // console.log(bodyContent)
  const document = new JSDOM(bodyContent).window.document
  let body = document.body

  // DOM特殊标签处理
  funHandle(body, scriptCode, pageInfo)
  
  // 判断是否需要给组件外层包裹一层DIV
  // 如果body下有一级则不需要包裹一层,如果有多层则需要进行
  switch (body.children.length) {
    // 判断文件body是否为空
    case 0: {
      log.error(`页面 ${pageName} 为空!`)
      break
    }
    case 1: {
      const domBox = body.children[0]
      for (let ind = 0; ind < domBox.classList.length; ind++) {
        const classString = domBox.classList[ind]
        // 如果是模板，添加模板标识
        if (isTemple) domBox.setAttribute('template', pageName)
        needReplaceCssList.push([`.o-${pageName} .${classString} `, `.o-${pageName} `])
      }
      domBox.classList.add(`o-${pageName}`)
      // 如果是页面则为其加上id和class
      if (pageInfo.isPage) {
        // console.log(pageName, newTemplateName)
        domBox.classList.add(`ox`)
        domBox.setAttribute('id', `o-${pageName}`)
        // 单页面不需要设置隐藏
        if (Config.pageList.length !== 1) {
          domBox.style.display = 'none'
        }
      }
      bodyContent = domBox.outerHTML
      // 模板替换
      htmlText = htmlText.replace(pageInfo.temple, bodyContent)
      // 解析样式
      // 新一批的样式需要重启一行
      styleText += '\r\n' + Style(headFileContent, pageName)
      break
    }
    default: {
      // 给元素增加页面专属的class和id
      const domBox = document.createElement("div")
      domBox.classList.add(`o-${pageName}`)
      // 如果是模板，添加模板标识
      if (isTemple) domBox.setAttribute('template', pageName)
      // 如果是页面则为其加上id和class
      if (pageInfo.isPage) {
        // console.log(pageName, newTemplateName)
        domBox.classList.add(`ox`)
        domBox.setAttribute('id', `o-${pageName}`)
        // 单页面不需要设置隐藏
        if (Config.pageList.length !== 1) {
          domBox.style.display = 'none'
        }
      }
      domBox.innerHTML = body.innerHTML
      bodyContent = domBox.outerHTML
      // 模板替换
      htmlText = htmlText.replace(pageInfo.temple, bodyContent)
      // 解析样式
      // 新一批的样式需要重启一行
      styleText += '\r\n' + Style(headFileContent, pageName)
    }
  }
  // 将结果保存到模板缓存中
  log.debug(`缓存模板: ${pageSrc}`)
  templeTempList[hash] = htmlText
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
  if (!config) {
    throw '没有提供配置信息!'
  }
  // 全局变量初始化
  [scriptData, styleText, serverTempletMap, Config, needReplaceCssList, templeTempList] = [{}, '', {}, config, [], {}]
  
  // 将配置中的Script列表插入到dom中
  let templeData = `<!-- 页面区域 -->`
  // 错误处理
  if (!config.pageList) throw '配置项中没有配置关键数据pageList!'
  if (config.pageList.length === 0) throw '配置项pageList页面数不能为空!'
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
    pageInfo.outerHTML = templet
    templet = htmlTextHandle(pageInfo, false)
  })
  return {
    html: templet,
    style: styleText,
    script: `
      window.owo = {
        // 页面数据和方法
        script: ${Tool.fnStringify(scriptData)},
        // 页面默认入口
        entry: "${Config.entry}",
      };
    `,
    serverTempletMap,
    useAnimationList: useAnimationList,
    // 需要对模块里只有一个根节点的样式做特殊处理
    needReplaceCssList: needReplaceCssList
  }
}
module.exports = pageHandle