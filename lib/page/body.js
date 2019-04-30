'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

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



function funHandle (dom, pageName, scriptData, templateName, sourceText, pageInfo) {
  // 模板处理
  if (dom.tagName === 'TEMPLE') {
    const templeValue = dom.attributes.getNamedItem('src').value
    // 处理模板
    dom.outerHTML = htmlTextHandle(dom.outerHTML, {
      src: templeValue,
      name: dom.attributes.getNamedItem('name').value,
      pageName: pageInfo.name,
      temple: dom.outerHTML
    }, true)
    return
  }

  if (dom.attributes.length > 0) {
    const attributes = dom.attributes
    // 待优化不
    // 读取DOM的每一个属性
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i]
      // ------------------------------------------------ @click 处理 ------------------------------------------------
      if (attribute.name === '@for') {
        dom.outerHTML = forEvent(dom, scriptData.data)
      }
    }
  }
  // 递归处理DOM节点下面的子节点
  for (var i = 0; i < dom.children.length; i++) {
    funHandle(dom.children[i], pageName, scriptData, templateName, sourceText, pageInfo)
  }
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
      log.error(`模板: ${bodyFilePath}不存在!`)
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
function htmlTextHandle (htmlText, pageInfo, isTemple) {
  // 判断缓存中是否有此模板,有的话不需要重新计算
  if (templeTempList[pageInfo.src]) {
    log.debug(`使用缓存返回模板: ${pageInfo.src}`)
    return templeTempList[pageInfo.src]
  }
  log.debug(`处理模板: ${pageInfo.src}`)
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
      scriptData[pageInfo.name] = scriptCode
    } else {
      // 判断模板是否包含created事件
      if (scriptData[pageInfo.pageName].template === undefined) scriptData[pageInfo.pageName].template = {}
      scriptData[pageInfo.pageName].template[pageInfo.name] = scriptCode
    }
  } else {
    scriptData[pageInfo.name] = {}
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
  funHandle(body, pageInfo.name, scriptCode, pageInfo.isPage ? '' : pageInfo.name, pageInfo.temple, pageInfo)
  
  // 判断是否需要给组件外层包裹一层DIV
  // 如果body下有一级则不需要包裹一层,如果有多层则需要进行
  switch (body.children.length) {
    // 判断文件body是否为空
    case 0: {
      log.error(`页面 ${pageInfo.name} 为空!`)
      break
    }
    case 1: {
      const domBox = body.children[0]
      for (let ind = 0; ind < domBox.classList.length; ind++) {
        const classString = domBox.classList[ind]
        // 如果是模板，添加模板标识
        if (isTemple) domBox.setAttribute('template', pageInfo.name)
        needReplaceCssList.push([`.o-${pageInfo.name} .${classString} `, `.o-${pageInfo.name} `])
      }
      domBox.classList.add(`o-${pageInfo.name}`)
      // 如果是页面则为其加上id和class
      if (pageInfo.isPage) {
        // console.log(pageName, newTemplateName)
        domBox.classList.add(`ox`)
        domBox.setAttribute('id', `o-${pageInfo.name}`)
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
      styleText += '\r\n' + Style(headFileContent, pageInfo.name)
      break
    }
    default: {
      // 给元素增加页面专属的class和id
      const domBox = document.createElement("div")
      domBox.classList.add(`o-${pageInfo.name}`)
      // 如果是模板，添加模板标识
      if (isTemple) domBox.setAttribute('template', pageInfo.name)
      // 如果是页面则为其加上id和class
      if (pageInfo.isPage) {
        // console.log(pageName, newTemplateName)
        domBox.classList.add(`ox`)
        domBox.setAttribute('id', `o-${pageInfo.name}`)
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
      styleText += '\r\n' + Style(headFileContent, pageInfo.name)
    }
  }
  // 将结果保存到模板缓存中\
  log.debug(`缓存模板: ${pageInfo.src}`)
  templeTempList[pageInfo.src] = htmlText
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
    templet = htmlTextHandle(templet, pageInfo, false)
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