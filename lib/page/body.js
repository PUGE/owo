'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

const path = require('path')

// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger('index.js')
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



function funHandle (dom, pageName, scriptData, templateName, sourceText, pageInfo) {
  // 模板处理
  if (dom.tagName === 'TEMPLE') {
    const templeValue = dom.attributes.getNamedItem('src').value
    logger.debug(`处理模板: ${templeValue}`)
    // 处理模板
    dom.outerHTML = htmlTextHandle(dom.outerHTML, {
      src: dom.attributes.getNamedItem('src').value,
      name: dom.attributes.getNamedItem('name').value,
      pageName: pageInfo.name,
      temple: dom.outerHTML
    })
    return
  }

  if (dom.attributes.length > 0) {
    const attributes = dom.attributes
    // 读取DOM的每一个属性
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i]
      // ------------------------------------------------ @click 处理 ------------------------------------------------
      if (attribute.name === '@for') {
        dom.outerHTML = forEvent(dom, scriptData.data)
      } else if (attribute.name === '@click') {
        // 判断是否为模板
        if (templateName !== '') {
          dom.setAttribute('template', templateName)
        }
        // 判断点击事件中是否包含动画
        if (attribute.value.includes('$go(')) {
          // 处理使用到的特效
          let animation = Cut.string(attribute.value, '$go(', ')')
          // 遍历特效函数
          animation = animation.replace(/"/g, '')
          animation = animation.replace(/'/g, '')
          animation = animation.replace(/ /g, '')
          // 取出每一个参数
          const parameterList = animation.split(',')
          if (parameterList[1]) {
            useAnimationList.add(parameterList[1])
          }
          if (parameterList[2]) {
            useAnimationList.add(parameterList[2])
          }
        }
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
      logger.error(`模板: ${bodyFilePath}不存在!`)
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
    logger.error(`模板为空!`)
    return htmlText
  }
  domBox.innerHTML = body.innerHTML
  bodyContent = domBox.outerHTML
  // 模板替换
  htmlText = htmlText.replace(pageInfo.temple, bodyContent)
  
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
  logger.debug(`页面中使用到的动画列表: ${useAnimationList.toString()}`)
  return {
    html: templet,
    style: styleText,
    script: `
      window.ozzx = {
        script: ${Tool.fnStringify(scriptData)},
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