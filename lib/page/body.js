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
const Clear = require('../handle/clear')

// 事件处理
const forEvent = require('./event/for')

let styleText = ''
let scriptData = {}

// 存储网络模板映射关系
let serverTempletMap = {}
let useAnimationList = new Set()

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

// 需要做特殊处理的css列表
let needReplaceCssList = []

let plugList = new Set()



function funHandle (dom, scriptData, pageInfo) {
  // console.log(pageInfo.name)
  // const pageName = pageInfo.isPage ? pageInfo.name : pageInfo.prop.name
  // 模板处理
  if (dom.tagName === 'TEMPLE') {
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
      templeName: prop.name,
      hash: crypto.createHash('md5').update(dom.outerHTML).digest('hex'),
      // 待优化， 应该使用一个
      temple: dom.outerHTML,
      outerHTML: dom.outerHTML,
      // 内部html
      innerHTML: dom.innerHTML
    })
    log.debug(`模板${pageInfo.name}处理用时: ${(new Date()).valueOf() - startTime} 毫秒!`)
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
          const path = Config.outPut.merge ? `./static/font/${value}` : `../font/${value}`
          if (!fontList[attribute.value]) fontList[attribute.value] = ''
          // 待修复 jsdom不支持innerText
          fontList[attribute.value] += dom.innerHTML
          
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
          break
        }
        // 处理tap事件
        case ':tap': {
          plugList.add('tap')
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
  const pageSrc = pageInfo.src || pageInfo.prop.src
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
function scriptHandle (pageInfo, scriptCode) {
  const pageName = pageInfo.isPage ? pageInfo.name : pageInfo.templeName
  if (scriptCode) {
    // 清理无用对象
    if (!Config.debug) scriptCode = Clear(scriptCode)
  } else {
    scriptCode = {}
  }
  
  // 判断是页面还是模块
  if (pageInfo.isPage) {
    scriptData[pageName] = scriptCode || {}
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
    lang = Cut.string(headFileContent, langStart[0], '"')
  }
  // 判断是否需要使用pug插件
  if (lang === 'pug') {
    return 'pug'
  }
  return null
}

/**
 * 处理文本形式的html代码
 * @param  {string} pageInfo 页面配置
 * @return {string} 返回参数值
 */
function templateTextHandle (pageInfo, headFileContent, pageScript, scriptCode) {
  // 获取到页面/模块名
  const pageName = pageInfo.isPage ? pageInfo.name : pageInfo.templeName
  const pageSrc = pageInfo.isPage ? pageInfo.src : pageInfo.prop.src
  // 获取模板的html文本
  let htmlText = pageInfo.outerHTML
  

  // 解析出Body内容
  let bodyContent = Cut.string(headFileContent, headFileContent.match(/<template.*?>/), "</template>")
  // 根据不同语言解析body内容
  switch (getLang(headFileContent)) {
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
  }
  // 将文本转化为DOM元素
  // console.log(bodyContent)
  const document = new JSDOM(bodyContent).window.document
  let body = document.body

  
  // DOM特殊标签处理
  funHandle(body, scriptCode, pageInfo)

  // console.log(plugList)
  
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

      // 添加模板标识
      domBox.setAttribute('template', pageName)
      for (let ind = 0; ind < domBox.classList.length; ind++) {
        const classString = domBox.classList[ind]
        // 如果设置了压缩css，那么替换规则应该只有一种格式
        if (Config.outPut.minifyCss) {
          needReplaceCssList.push([`[template=${pageName}] .${classString}{`, `.${classString}[template="${pageName}"]{`])
        } else {
          // 修复外层盒子class规则
          needReplaceCssList.push([`[template="${pageName}"] .${classString}:`, `.${classString}[template="${pageName}"]:`])
          needReplaceCssList.push([`[template="${pageName}"] .${classString} `, `.${classString}[template="${pageName}"] `])
          needReplaceCssList.push([`[template="${pageName}"] .${classString}{`, `.${classString}[template="${pageName}"]{`])
          
        }
      }
      // 修复外层盒子标签规则
      if (Config.outPut.minifyCss) {
        needReplaceCssList.push([`[template=${pageName}] ${domBox.localName}{`, `${domBox.localName}[template="${pageName}"]{`])
      } else {
        needReplaceCssList.push([`[template="${pageName}"] ${domBox.localName}:`, `${domBox.localName}[template="${pageName}"]:`])
        needReplaceCssList.push([`[template="${pageName}"] ${domBox.localName} `, `${domBox.localName}[template="${pageName}"] `])
        needReplaceCssList.push([`[template="${pageName}"] ${domBox.localName}{`, `${domBox.localName}[template="${pageName}"]{`])
      }

      // 如果是页面则为其加上id和class
      if (pageInfo.isPage) {
        // console.log(pageName, newTemplateName)
        domBox.classList.add(`ox`)
        // 单页面不需要设置隐藏
        if (Config.pageList.length !== 1) {
          domBox.style.display = 'none'
        }
      }
      bodyContent = domBox.outerHTML
      // 模板替换
      // console.log(htmlText, pageInfo.temple)
      htmlText = htmlText.replace(pageInfo.temple, bodyContent)
      // 防止样式重复打包
      if (!srcCache.includes(pageName + pageSrc)) {
        srcCache.push(pageName + pageSrc)
        // 模板插值处理
        headFileContent = interpolationHandle(headFileContent, pageScript)
        // 解析样式
        // 新一批的样式需要重启一行
        styleText += '\r\n' + Style(headFileContent, pageName)
      } else {
        log.debug(`智能跳过打包${pageName + pageSrc}的重复样式!`)
      }
      break
    }
    default: {
      // 给元素增加页面专属的class和id
      const domBox = document.createElement("div")
      // 添加模板标识
      domBox.setAttribute('template', pageName)
      // 如果是页面则为其加上id和class
      if (pageInfo.isPage) {
        // console.log(pageName, newTemplateName)
        domBox.classList.add(`ox`)
        // 单页面不需要设置隐藏
        if (Config.pageList.length !== 1) {
          domBox.style.display = 'none'
        }
      }
      domBox.innerHTML = body.innerHTML
      bodyContent = domBox.outerHTML
      // 模板替换
      htmlText = htmlText.replace(pageInfo.temple, bodyContent)
      if (!srcCache.includes(pageName + pageSrc)) {
        srcCache.push(pageName + pageSrc)
        // 解析样式
        // 新一批的样式需要重启一行
        styleText += '\r\n' + Style(headFileContent, pageName)
      } else {
        log.debug(`智能跳过打包${pageName + pageSrc}的重复样式!`)
      }
    }
  }
  // 将结果保存到模板缓存中
  log.debug(`缓存模板: ${pageName + pageSrc}`)
  
  return htmlText
}


/**
 * 对文本格式的模板进行处理
 *
 * @param {string} pageInfo 页面的数据
 * @return {Object} 返回值描述
 */

function htmlTextHandle (pageInfo) {
  // 重名模块处理
  let pageNameIndex = 0
  // 取出页面或组件缓存
  // console.log(pageInfo.name)
  let scriptDataTemp = pageInfo.isPage ? scriptData : scriptData[pageInfo.name].template
  if (scriptDataTemp) {
    while (pageInfo.name in scriptDataTemp) {
      pageNameIndex++
      pageInfo.name = `${pageInfo.name}${pageNameIndex}`
    }
    log.debug(`模块 ${pageInfo.name} 因名称重复被重命名为 ${pageInfo.name}${pageNameIndex}`)
  }
  
  log.info(`开始处理模块: ${pageInfo.name}`)
  // 获取模板的html文本
  let htmlText = pageInfo.outerHTML
  // console.log(pageInfo.hash)
  // 判断缓存中是否有此模板,有的话不需要重新计算
  // console.log(pageInfo)
  if (htmlCache[pageInfo.hash]) {
    log.debug(`使用缓存返回模板: ${pageInfo.name}`)
    scriptHandle(pageInfo, scriptCache[pageInfo.hash])
    return htmlCache[pageInfo.hash]
  }

  // 模板文件内容
  let headFileContent = getFileContent(pageInfo)
  
  // 取出页面中的js内容
  
  
  const scriptText = Cut.string(headFileContent, "<script>", "</script>")
  // console.log(scriptText)
  const scriptCode = eval(scriptText)
  // 存储当前页面的
  let pageScript = scriptHandle(pageInfo, scriptCode)
  // console.log(scriptText)
  // 如果页面没有js也为其创建一个空对象
  
  // name和src属性不需要打包在前端显示出来
  // 待优化 总觉得有更好的办法
  if (pageInfo.prop) {
    delete pageInfo.prop["name"]
    delete pageInfo.prop["src"]
  }

  htmlText = templateTextHandle(pageInfo, headFileContent, pageScript, scriptCode)
  scriptCache[pageInfo.hash] = scriptCode
  htmlCache[pageInfo.hash] = htmlText
  // 模板插值处理
  return interpolationHandle(htmlText, pageScript)
  
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
  [scriptData, styleText, serverTempletMap, Config, needReplaceCssList, htmlCache, srcCache, fileCache, fontList] = [{}, '', {}, config, [], {}, [], {}, {}]

  // 创建模块下载文件夹(owo_modules目录)
  Tool.creatDirIfNotExist(path.join(process.cwd(), 'owo_modules'))
  
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
    // pageList均为页面，所以需要添加上页面标识
    config.pageList[ind].isPage = true
  }
  // console.log(templet)
  templet = templet.replace('<!-- page-output -->', templeData)
  
  // ---------------------- 页处理 ----------------------
  config.pageList.forEach(pageInfo => {
    pageInfo.outerHTML = templet
    pageInfo.hash = crypto.createHash('md5').update(templet).digest('hex')
    const startTime = (new Date()).valueOf()
    templet = htmlTextHandle(pageInfo)
    log.debug(`模板${pageInfo.name || pageInfo.prop.name}处理用时: ${(new Date()).valueOf() - startTime} 毫秒!`)
  })
  return {
    html: templet,
    style: styleText,
    plugList,
    script: `
      // 存储页面基本信息
      var owo = {
        // 页面默认入口 如果没有设置 则取第一个页面为默认页面
        entry: "${Config.entry ? Config.entry : Config.pageList[0].name}",
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
    useAnimationList: useAnimationList,
    // 需要对模块里只有一个根节点的样式做特殊处理
    needReplaceCssList: needReplaceCssList,
    fontList: fontList
  }
}
module.exports = pageHandle