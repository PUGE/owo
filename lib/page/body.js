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
const log = require('../tool/log')()
const Tool = require('../tool/tool')
// 同步请求
const request = require('urllib-sync').request
const Style = require('./style')
const clearNoUse = require('./clearNoUse')

// 事件处理
const forEvent = require('./event/for')

let styleText = ''
let scriptData = {}

// 存储网络模板映射关系
let serverTempletMap = {}

// 全局配置项
let Config = {}

// 模板缓存 作用: 1.已经处理过的模板不需要进行二次处理 2.
let htmlCache = {}

// script缓存
let scriptCache = {}

// 模板路径缓存
let srcCache = []

// 模块内容缓存
let fileCache = {}

// 字体处理
let fontList = {}

let plugList = new Set()

// hover效果
let hoverList = new Set()



function funHandle (dom, scriptData, pageInfo) {
  // 模板处理
  if (dom.tagName === 'PLUG') {
    // console.log(pageInfo)
    // console.log('---------')
    // 取出模板属性列表列表
    let prop = {}
    for (let ind = 0; ind < dom.attributes.length; ind++) {
      const nodeName = dom.attributes[ind].nodeName
      let value = dom.attributes[ind].value
      // 判断是一个纯文本字符串还是一个变量
      if (value.startsWith('{{') && value.endsWith('}}')) {
        // 变量参数处理
        value = Tool.getValFromObj(value.slice(2, -2), scriptData)
      }
      prop[nodeName] = value
    }
    // console.log(prop)
    // 处理模板
    const startTime = (new Date()).valueOf()
    dom.outerHTML = htmlTextHandle({
      prop: prop,
      // 页面名称
      name: pageInfo.name,
      templeName: prop['_name'] || prop.name,
      hash: crypto.createHash('md5').update(dom.outerHTML).digest('hex'),
      // 待优化， 应该使用一个
      temple: dom.outerHTML,
      // 内部html
      innerHTML: dom.innerHTML
    }, dom.outerHTML)
    log.debug(`模块${prop['_name'] || prop.name}处理用时: ${(new Date()).valueOf() - startTime} 毫秒!`)
    return
  } else if (dom.tagName === 'SLOT') {
    // console.log(dom.outerHTML, pageInfo.innerHTML)
    // 如果是插口，取出模板内的html替换
    dom.outerHTML = pageInfo.innerHTML
  }
  
  if (dom.attributes.length > 0) {
    const prop = dom.attributes
    // 待优化不
    // 读取DOM的每一个属性
    for (let i = 0; i < prop.length; i++) {
      const attribute = prop[i]
      switch (attribute.name) {
        case ':for': {
          // 待优化 如果data中没有对应的 会报错
          if (pageInfo.prop && scriptData) scriptData.prop = pageInfo.prop
          dom.outerHTML = forEvent(dom, scriptData)
          break
        }
        case ':if': {
          if (!Tool.getValFromObj(attribute.value, scriptData)) {
            // 删除此dom节点
            dom.style.display = 'none'
          }
          break
        }
        // 处理字体
        case 'font': {
          const value = attribute.value.split('.')[0]
          const path = `../font/${value}`
          if (!fontList[attribute.value]) {
            fontList[attribute.value] = ''
            // 如果是第一次遇到这个字体，需要加上对应字体的样式
            styleText += `
              [font="${attribute.value}"] {
                font-family: '${value}';
              }
              @font-face {
                font-family: '${value}';
                src: url('${path}.eot');
                src: url('${path}.eot?#iefix') format('embedded-opentype'),
                  url('${path}.woff') format('woff'),
                  url('${path}.ttf')  format('truetype'),
                  url('${path}.svg#MicrosoftYaHei') format('svg');
              }
            `
          }
          // 待修复 jsdom不支持innerText
          fontList[attribute.value] += dom.innerHTML
          break
        }
        // 处理tap事件
        case ':tap': {
          plugList.add('tap')
          break
        }
        case 'o-hover': {
          const value = attribute.value
          if (!hoverList.has(value)) {
            const filePath = path.join(__dirname, '../../', 'core' , 'hover', `${value}.css`)
            hoverList.add(value)
            styleText += Tool.loadFile(filePath) + '\r\n'
          }
          dom.classList.add(`owo-hover-${value}`)
          dom.removeAttribute('o-hover')
          break
        }
      }
    }
  }
  // 递归处理DOM节点下面的子节点
  for (var i = 0; i < dom.children.length; i++) {
    funHandle(dom.children[i], scriptData, pageInfo)
  }
}

// 模板插值处理
function interpolationHandle (outerHTML, scriptCode) {
  let temp = Tool.cutString(outerHTML, '{{', '}}')
  while (temp) {
    const value = Tool.getValFromObj(temp, scriptCode)
    outerHTML = Tool.replaceAll(outerHTML, `{{${temp}}}`, value)
    temp = Tool.cutString(outerHTML, '{{', '}}')
  }
  return outerHTML
}

/**
 * 对文本格式的模板进行处理
 *
 * @param {Object} templateName 模板名称/路径/网络地址
 * @return {Object} 返回值描述
 */
function getFileContent (pageInfo) {
  const pageSrc = pageInfo.src || pageInfo.prop['_src'] || pageInfo.prop['src']
  // 计算模板src的hash
  const srcHash = crypto.createHash('md5').update(pageSrc).digest('hex')
  // 如果内存中已经缓存了文件内容，则直接返回文件内容
  if (fileCache[srcHash]) {
    return fileCache[srcHash]
  }

  let headFileContent = ''
  // 判断是否为网路地址
  if (pageSrc.startsWith('http')) {
    // 模块下载目录
    const modulesPath = path.join(process.cwd(), 'owo_modules', srcHash + '.owo')
    // 判断模块是否有文件缓存
    if (fs.existsSync(modulesPath)) {
      log.debug(`使用文件缓存:${modulesPath}`)
      headFileContent = fs.readFileSync(modulesPath, 'utf8')
    } else {
      // 没有文件缓存则从网络读取
      log.debug(`开始获取网络模板:${pageSrc}`)
      headFileContent = request(pageSrc).data.toString()
      // 写入文件缓存
      fs.writeFileSync(modulesPath, headFileContent)
    }
    
  } else {
    // body目录
    const bodyFilePath = path.join(process.cwd(), pageSrc)
    // console.log(bodyFilePath)
    if (fs.existsSync(bodyFilePath)) {
      headFileContent = fs.readFileSync(bodyFilePath, 'utf8')
    } else {
      throw new Error('模板: ' + bodyFilePath + '不存在!')
    }
  }
  // 将文件内容缓存到内存中
  fileCache[srcHash] = headFileContent
  return headFileContent
}

// 待优化 可以缓存的更好
function scriptHandle (pageInfo, scriptCode = {}) {
  const pageName = pageInfo.type ? pageInfo.name : pageInfo.templeName
  scriptData[pageName] = scriptCode
  // 判断是页面还是模块
  if (pageInfo.type) {
    
    scriptData[pageName].prop = pageInfo.prop
    return scriptData[pageName]
  } else {
    // 判断模板是否包含created事件
    // 判断是否为模板
    if (scriptData[pageInfo.name].template === undefined) scriptData[pageInfo.name].template = {}
    scriptData[pageInfo.name].template[pageName] = scriptCode
    // 填入模板属性
    scriptData[pageInfo.name].template[pageName].prop = pageInfo.prop
    return scriptData[pageInfo.name].template[pageName]
  }
}

/**
 * 获取使用语言
 * @param  {string} headFileContent 代码块
 * @return {string} 使用语言
 */
function getLang  (headFileContent) {
  // 判断是否需要使用插件预处理
  let lang = null
  // console.log(headFileContent)
  const langStart = headFileContent.match(/<template.*?lang="/)
  if (langStart) {
    lang = Tool.cutString(headFileContent, langStart[0], '"')
  }
  return lang
}

/**
 * 处理文本形式的html代码
 * @param  {string} pageInfo 页面配置
 * @return {string} 返回参数值
 */
function templateTextHandle (pageInfo, headFileContent, pageScript, scriptCode, assemblyName, htmlText) {
  // 获取到页面/模块名
  const templeName = pageInfo.type ? pageInfo.name : pageInfo.templeName
  const pageSrc = pageInfo.type ? pageInfo.src : (pageInfo.prop['_src'] || pageInfo.prop['src'])
  // console.log(pageInfo.prop)

  
  // 解析出Body内容
  let bodyContent = Tool.cutString(headFileContent, headFileContent.match(/<template.*?>/), "</template>")
  // 根据不同语言解析body内容
  const lang = getLang(headFileContent)
  if (lang) {
    switch (lang) {
      case 'pug': {
        const pugPath = path.join(process.cwd(), 'node_modules', 'pug')
        // 判断是否安装了pug
        if (!fs.existsSync(pugPath)) {
          throw '请使用 npm i -save pug 或 yarn add pug 安装pug模块!'
        }
        const pugRender = require(pugPath)
        bodyContent = pugRender.compile(bodyContent)()
        break
      }
      default: {
        console.error(`不支持的语言类型: ${lang}`)
      }
    }
  }
  // 将文本转化为DOM元素
  // console.log(bodyContent)
  const document = new JSDOM(bodyContent).window.document
  let body = document.body

  
  // DOM特殊标签处理
  funHandle(body, scriptCode, pageInfo)

  if (body.children.length == 0) {
    console.error(`页面 ${assemblyName} 为空!`)
    return htmlText
  }
  // 判断是否需要给组件外层包裹一层DIV
  // 如果body下有一级则不需要包裹一层,如果有多层则需要进行
  let domBox = body.children[0]
  if (body.children.length > 1) {
    // 给元素增加页面专属的class和id
    domBox = document.createElement("div")
    domBox.innerHTML = body.innerHTML
  }
  if (pageInfo.prop) {
    for (const propKey in pageInfo.prop) {
      if (pageInfo.prop.hasOwnProperty(propKey)) {
        const element = pageInfo.prop[propKey]
        if (!element) continue
        if (propKey === 'class') {
          element.split(' ').forEach(element => {
            domBox.classList.add(element)
          })
        } else if (propKey.startsWith(':')) {
          domBox.setAttribute(propKey, element)
        }
      }
    }
  }
  // 如果模块除了prop还有其它函数方法，则必须设置template
  // console.log(pageScript)
  if (Object.keys(pageScript).length > 1) {
    // 添加模板标识
    domBox.setAttribute('template', templeName)
  }
  if (domBox.classList.length === 0) domBox.classList.add(`owo-${assemblyName}`)

  // 如果是页面则为其加上id和class
  // 待优化 可以合并
  if (pageInfo.type === 'page') {
    domBox.classList.add(`owo`)
    // 单页面不需要设置隐藏
    if (Config.pageList.length !== 1) {
      domBox.style.display = 'none'
    }
  } else if (pageInfo.type === 'plug') {
    domBox.classList.add(`owo-plug`)
  }
  bodyContent = domBox.outerHTML
  // 模板替换
  // console.log(htmlText, pageInfo.temple)
  htmlText = htmlText.replace(pageInfo.temple, bodyContent)
  // 防止样式重复打包
  if (!srcCache.includes(assemblyName + pageSrc)) {
    // 将结果保存到模板缓存中
    log.debug(`缓存模板: ${assemblyName + pageSrc}`)
    srcCache.push(assemblyName + pageSrc)
    // 模板插值处理
    headFileContent = interpolationHandle(headFileContent, pageScript)
    // 解析样式
    // 新一批的样式需要重启一行
    // 如果只有一个页面 那么样式不需要包裹页面那一层
    styleText += '\r\n' + Style(headFileContent, domBox.classList, domBox.localName, pageInfo.type === 'page' && Config.pageList.length < 2)
  } else {
    log.debug(`智能跳过打包${assemblyName + pageSrc}的重复样式!`)
  }
  return htmlText
}

/**
 * 对文本格式的模板进行处理
 *
 * @param {string} pageInfo 页面的数据
 * @return {Object} 返回值描述
 */

function htmlTextHandle (pageInfo, htmlText) {
  // console.log(pageInfo)
  // 重名模块处理
  let pageNameIndex = 0
  // 取出页面或组件缓存
  // console.log(pageInfo.name)
  
  // 页面或者模块的名称
  let assemblyName = pageInfo.type ? pageInfo.name : pageInfo.templeName
  const assemblyNameCopy = assemblyName
  // console.log(assemblyName)
  let scriptDataTemp = pageInfo.type ? scriptData : scriptData[pageInfo.name].template
  // console.log(scriptDataTemp)
  if (scriptDataTemp) {
    
    while (assemblyName in scriptDataTemp) {
      pageNameIndex++
      // console.log(pageInfo.type ? pageInfo.name : pageInfo.templeName)
      assemblyName = `${pageInfo.type ? pageInfo.name : pageInfo.templeName}-${pageNameIndex}`
    }
    
    // 判断是否被更名过
    if (pageNameIndex > 0) {
      log.debug(`模块 ${pageInfo.type ? pageInfo.name : pageInfo.templeName} 因名称重复被重命名为 ${assemblyName}`)
      if (pageInfo.type) pageInfo.name = assemblyName
      else pageInfo.templeName = assemblyName
    }
  }
  
  log.info(`开始处理模块: ${assemblyName}`)
  // console.log(pageInfo.hash)
  // 判断缓存中是否有此模板,有的话不需要重新计算
  // console.log(pageInfo)
  if (htmlCache[pageInfo.hash]) {
    log.debug(`使用缓存返回模板: ${assemblyName}`)
    scriptHandle(pageInfo, scriptCache[pageInfo.hash])
    return htmlCache[pageInfo.hash]
  }

  // 模板文件内容
  let headFileContent = getFileContent(pageInfo)
  
  // 取出页面中的js内容
  
  
  const scriptText = Tool.cutString(headFileContent, "<script>", "</script>")
  // console.log(scriptText)
  const scriptCode = eval(scriptText)
  // 存储当前页面的
  let pageScript = scriptHandle(pageInfo, scriptCode)
  // console.log(scriptText)
  // 如果页面没有js也为其创建一个空对象
  
  // name和src属性不需要打包在前端显示出来

  htmlText = templateTextHandle(pageInfo, headFileContent, pageScript, scriptCode, assemblyNameCopy, htmlText)
  
  scriptCache[pageInfo.hash] = scriptCode
  // 模板插值处理
  htmlCache[pageInfo.hash] = interpolationHandle(htmlText, pageScript)
  
  return htmlCache[pageInfo.hash]
}


/**
 * 解析Html
 *
 * @param {string} htmlText html文本
 * @param {string} packConfig 打包配置
 * @return {Object} 解析完成的数据
 */
function pageHandle (templet, config) {
  if (!config) { throw '没有提供配置信息!' }
  
  // 全局变量初始化
  [scriptData, styleText, serverTempletMap, Config, htmlCache, srcCache, fileCache, fontList, hoverList] = [{}, '', {}, config, {}, [], {}, {}, new Set()]

  // 创建模块下载文件夹(owo_modules目录)
  Tool.creatDirIfNotExist(path.join(process.cwd(), 'owo_modules'))
  
  // 将配置中的Script列表插入到dom中
  let templeData = `<!-- 页面区域 -->`
  // 错误处理
  if (!config.pageList || config.pageList.length === 0) throw '配置项pageList页面数不能为空!'
  for (let ind = 0; ind < config.pageList.length; ind++) {
    
    const element = config.pageList[ind]
    // 判断是否为插件
    config.pageList[ind].type = config.pageList[ind].type ? config.pageList[ind].type : 'page'
    const templeTemp = `<plug name="${element.name}" src="${element.src}" type="${config.pageList[ind].type}"></plug>`
    templeData += `\r\n    <!-- 页面[${element.name}]-->\r\n    ${templeTemp}`
    config.pageList[ind].temple = templeTemp
  }

  // 判断是否有包裹容器
  if (config.container) {
    templet = templet.replace('<!-- page-output -->', `<div class="${config.container}">${templeData}</div>`)
  } else {
    templet = templet.replace('<!-- page-output -->', templeData)
  }
  
  // ---------------------- 页处理 ----------------------
  config.pageList.forEach(pageInfo => {
    pageInfo.hash = crypto.createHash('md5').update(templet).digest('hex')
    const startTime = (new Date()).valueOf()
    templet = htmlTextHandle(pageInfo, templet)
    log.debug(`页面${pageInfo.name || pageInfo.prop['_name'] || pageInfo.prop.name}处理用时: ${(new Date()).valueOf() - startTime} 毫秒!`)
  })
  
  // 清理数据
  clearNoUse(scriptData)
  // 返回数据
  return {
    html: templet,
    style: styleText,
    plugList,
    hoverList,
    script: `
      // 存储页面基本信息
      var owo = {
        // 手机入口
        phoneEnter: "${Config.phoneEnter ? Config.phoneEnter : null}",
        // 全局方法变量
        tool: {},
        // 框架状态变量
        state: {},
      };
      /*
        存储每个页面的函数
        键名：页面名称
        键值：方法列表
      */
      owo.script = ${Tool.fnStringify(scriptData)}
    `,
    serverTempletMap,
    fontList: fontList
  }
}
module.exports = pageHandle