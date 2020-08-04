'use strict'

const fs = require('fs')
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom

// 加解密
const crypto = require('crypto')

const path = require('path')

const {parse} = require('@babel/parser')

// 注册事件回调
const register = require('../register')
const Storage = require('../storage')

// 日志输出
// 配置输出插件
const log = require('../tool/log')
const Tool = require('../tool/tool')
const checkNoScript = require('../tool/checkNoScript')
// 同步请求
const request = require('urllib-sync').request
const Style = require('./style')

const handleLink = require('../tool/handleLink.js')
const { ERANGE } = require('constants')

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

// 字体处理
let fontList = {}

// hover效果
let hoverList = new Set()

// 全局js
let globalScript = ''



function funHandle (dom, scriptData, pageInfo) {
  // 取出模板属性列表列表
  let prop = {}
  for (let ind = 0; ind < dom.attributes.length; ind++) {
    const nodeName = dom.attributes[ind].nodeName
    let value = dom.attributes[ind].value
    // 判断是一个纯文本字符串还是一个变量
    // 待优化 只是后端渲染有啥意思
    if (value.startsWith('{{') && value.endsWith('}}')) {
      // 变量参数处理
      value = Tool.getValFromObj(value.slice(2, -2), scriptData)
    }
    switch (nodeName) {
      // 处理字体
      case 'font': {
        const fontName = value.split('.')[0]
        dom.setAttribute('font', fontName)
        const path = `../font/${fontName}`
        if (!fontList[value]) {
          fontList[value] = ''
          // 如果是第一次遇到这个字体，需要加上对应字体的样式
          styleText += `
            [font="${fontName}"] {
              font-family: '${fontName}';
            }
            @font-face {
              font-family: '${fontName}';
              src: url('${path}.eot');
              src: url('${path}.eot?#iefix') format('embedded-opentype'),
                url('${path}.woff') format('woff'),
                url('${path}.ttf')  format('truetype'),
                url('${path}.svg#MicrosoftYaHei') format('svg');
            }
          `
        }
        // 待修复 jsdom不支持innerText
        fontList[value] += dom.innerHTML
        break
      }
      // 处理tap事件
      case 'o-tap': {
        Storage.plugList.add('tap')
        break
      }
      case 'o-for': {
        Storage.plugList.add('for')
        break
      }
      case 'o-if': {
        Storage.plugList.add('if')
        break
      }
      case 'o-show': {
        Storage.plugList.add('show')
        break
      }
      case 'o-value': {
        Storage.plugList.add('value')
        break
      }
      case 'o-hover': {
        Storage.plugList.add('hover')
        if (!hoverList.has(value)) {
          hoverList.add(value)
          styleText += Tool.loadFile(path.join(__dirname, '../../', 'core' , 'hover', `${value}.css`)) + '\r\n'
        }
        break
      }
      case 'o-animation': {
        if (!Storage.animationList.includes(value)) {
          const filePath = path.join(__dirname, '../../', 'core' , 'animation', `${value}.css`)
          Storage.animationList.push(value)
          styleText += '\r\n' + Tool.loadFile(filePath) + '\r\n'
        }
        break
      }
      case 'id': {
        Storage.plugList.add('id')
        break
      }
      case 'go': {
        Storage.plugList.add('go')
        const aniList = value.split('/')
        let number = aniList.length < 4 ? aniList.length : 4
        for (let index = 2; index < number; index++) {
          const element = aniList[index];
          let temp = element.split('&&')
          temp.forEach(animation => {
            Storage.pageAnimationList.add(animation)
          })
        }
        break
      }
      case 'route': {
        Storage.plugList.add('route')
        // 处理模板
        let routeSrc = dom.attributes['src'] || dom.attributes['_src']
        if (routeSrc) {
          routeSrc = routeSrc.value
          const startTime = (new Date()).valueOf()
          log.debug(`处理路由: ${pageInfo.viewName}`)
          dom.outerHTML = htmlTextHandle({
            type: "route",
            viewName: pageInfo.viewName,
            prop: prop,
            src: routeSrc,
            // 页面名称
            name: pageInfo.name,
            templeName: value,
            temple: dom.outerHTML,
            // 内部html
            innerHTML: dom.innerHTML
          }, dom.outerHTML, scriptData)
          log.debug(`路由${value}处理用时: ${(new Date()).valueOf() - startTime} 毫秒!`)
        } else {
          if (pageInfo.viewName && scriptData.view) {
            scriptData.view[pageInfo.viewName].push({
              _name: value,
              // 继承他的父元素
              _inherit: true
            })
            log.info(`内置路由: ${value}`)
          } else {
            log.error('错误的使用了route标记!')
          }
        }
        break
      }
      case ':for': {
        dom.removeAttribute(':for')
        let newHtml = ''
        // 判断是否为数字
        if (isNaN(value)) {
          const tempObject = Tool.getValFromObj(value, scriptData)
          for (const key in tempObject) {
            if (tempObject.hasOwnProperty(key)) {
              const value = tempObject[key];
              let tempHtml = dom.outerHTML
              var varList = Tool.cutStringArray(tempHtml, '{', '}')
              varList.forEach(element => {
                const forValue = new Function('value', 'key', 'return ' + element)
                // 默认变量
                tempHtml = tempHtml.replace('{' + element + '}', forValue.apply(scriptData, [value, key]))
              })
              newHtml += tempHtml
            }
          }
        } else {
          for (let index = 0; index < Number(value); index++) {
            let tempHtml = dom.outerHTML
            var varList = Tool.cutStringArray(tempHtml, '{', '}')
            varList.forEach(element => {
              const forValue = new Function('value', 'key', 'return ' + element)
              // 默认变量
              tempHtml = tempHtml.replace('{' + element + '}', forValue.apply(scriptData, [index, index]))
            })
            newHtml += tempHtml
          }
        }
        dom.outerHTML = newHtml
      }
      default: {
        if (nodeName.slice(0, 8) === 'o-class-') {
          Storage.plugList.add('class')
          break
        }
      }
    }
    prop[nodeName] = value
  }
  // 模板处理
  switch (dom.tagName) {
    case 'PLUG': {
      // 处理模板
      const startTime = (new Date()).valueOf()
      dom.outerHTML = htmlTextHandle({
        type: "plug",
        prop: prop,
        // 页面名称
        name: pageInfo.name,
        templeName: prop['_name'] || prop.name,
        temple: dom.outerHTML,
        // 内部html
        innerHTML: dom.innerHTML
      }, dom.outerHTML, scriptData)
      
      log.debug(`模块${prop['_name'] || prop.name}处理用时: ${(new Date()).valueOf() - startTime} 毫秒!`)
      break
    }
    case 'SLOT': {
      // console.log(dom.outerHTML, pageInfo.innerHTML)
      // 如果是插口，取出模板内的html替换
      dom.outerHTML = pageInfo.innerHTML
      break
    }
    // 待优化 尝试是否能把view做成和route一样的形式 但是能阻止到View中处理
    case 'VIEW': {
      const templeName = prop['_name'] || prop.name
      if (!templeName) {
        console.log('有路由没有设置路由名字!')
        break
      }
      const children = dom.children
      pageInfo.viewName = templeName
      if (!scriptData.view) scriptData.view = {}
      scriptData.view[templeName] = []
      for (let i = 0; i < children.length; i++) {
        funHandle(dom.children[i], scriptData, pageInfo)
      }
      // 生成出新的字段
      let attributeStr = ''
      for (const key in dom.attributes) {
        if (dom.attributes.hasOwnProperty(key)) {
          const element = dom.attributes[key];
          let name = element.name
          if (name === 'name' || name === '_name') name = "view"
          attributeStr += ` ${name}="${element.value}"`
        }
      }
      dom.outerHTML = `<div${attributeStr}>${dom.innerHTML}</div>`
      break
    }
    case 'SHOWCASE': {
      // 生成出新的字段
      let attributeStr = ''
      const children = dom.children
      for (let i = 0; i < children.length; i++) {
        dom.children[i].style.display = 'none'
      }
      for (const key in dom.attributes) {
        if (dom.attributes.hasOwnProperty(key)) {
          const element = dom.attributes[key];
          let name = element.name
          if (name === 'name' || name === '_name') name = "showcase"
          attributeStr += ` ${name}="${element.value}"`
        }
      }
      dom.outerHTML = `<div${attributeStr} showcase>${dom.innerHTML}</div>`
      Storage.plugList.add('showcase')
      break
    }
    default: {
      // 递归处理DOM节点下面的子节点
      for (var i = 0; i < dom.children.length; i++) {
        funHandle(dom.children[i], scriptData, pageInfo)
      }
    }
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
  let filePath = pageInfo.src.split('/')
  filePath = filePath[filePath.length - 1]
  filePath = pageInfo.src.startsWith('http') ? path.join(process.cwd(), 'owo_modules', filePath) : path.join(process.cwd(), pageInfo.src)
  // 统一路径为左斜线
  filePath = filePath.replace(/\\/g, '/')
  // 如果内存中已经缓存了文件内容，则直接返回文件内容
  if (Storage.fileCache[filePath]) {
    log.debug(`从缓存中返回: ${filePath}`)
    return Storage.fileCache[filePath]
  }
  let headFileContent = ''
  // 判断是否为网路地址
  if (pageInfo.src.startsWith('http')) {
    
    // 判断模块是否有文件缓存
    if (fs.existsSync(filePath)) {
      log.debug(`使用文件缓存:${filePath}`)
      // 添加监视
      Storage.watcherFile[filePath] = { name: pageInfo.name, type: 'plug' }
      headFileContent = fs.readFileSync(filePath, 'utf8')
    } else {
      // 没有文件缓存则从网络读取
      log.debug(`开始获取网络模板:${pageInfo.src}`)
      headFileContent = request(pageInfo.src).data.toString()
      // 注册下载完毕事件
      headFileContent = register.downloadTemplate(headFileContent)
      // 写入文件缓存
      fs.writeFileSync(filePath, headFileContent)
    }
    // 记录处理过的模板
    // console.log(Storage.watcherFile)
    Storage.watcherFile[filePath] = {
      name: pageInfo.name,
      type: pageInfo.type
    }
  } else {
    // console.log(bodyFilePath)
    if (fs.existsSync(filePath)) {
      headFileContent = fs.readFileSync(filePath, 'utf8')
      // 记录处理过的模板
      Storage.watcherFile[filePath] = {
        name: pageInfo.name,
        type: pageInfo.type
      }
      // console.log(filePath)
    } else {
      throw new Error('模板: ' + filePath + '不存在!')
    }
  }
  // 将文件内容缓存到内存中
  Storage.fileCache[filePath] = headFileContent
  return headFileContent
}

// 待优化 可以缓存的更好
function scriptHandle (pageInfo, scriptCode, moduleScript) {
  // console.log(pageInfo)
  // return
  if (!scriptCode) scriptCode = {}
  if (!moduleScript) moduleScript = {}
  const pageName = getPageName(pageInfo)
  // console.log(pageName)
  // 判断是页面还是模块
  // 判断到底是什么类型的组件
  // moduleScript.type = pageInfo.type
  switch(pageInfo.type) {
    case 'page':
    case 'block': {
      log.debug(`创建页面/插件函数: ${pageName}`)
      moduleScript[pageName] = scriptCode
      moduleScript[pageName].prop = pageInfo.prop
      moduleScript[pageName].moduleType = pageInfo.type
      return moduleScript[pageName]
    }
    case 'plug': {
      // 判断是否为模板
      log.debug(`创建模板函数: ${pageName}`)
      if (moduleScript.template === undefined) moduleScript.template = {}
      moduleScript.template[pageName] = scriptCode
      moduleScript.template[pageName].prop = pageInfo.prop
      moduleScript.template[pageName].moduleType = pageInfo.type
      return moduleScript.template[pageName]
    }
    case 'route': {
      log.debug(`创建路由函数: ${pageName}`)
      const viewName = pageInfo.viewName
      const routeName = pageInfo.templeName
      // 判断是否为模板
      let temp = scriptCode
      temp.prop = pageInfo.prop
      temp._name = routeName
      moduleScript.view[viewName].push(temp)
      const itemIndex = moduleScript.view[viewName].length - 1
      return moduleScript.view[viewName][itemIndex]
    }
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
 * 将owo文件中的template内容处理成合法的html文本
 * @param  {string} pageInfo 页面配置
 * @return {string} 返回参数值
 */
function templateTextHandle (pageInfo, headFileContent, pageScript, scriptCode, assemblyName, htmlText) {
  
  // 解析出Body内容
  let bodyContent = Tool.cutString(headFileContent, headFileContent.match(/<template.*?>/), "</template>")
  // 模板插值处理
  if (!bodyContent) {
    throw new Error(`页面: ${pageInfo.name} 路径为: ${pageInfo.src} 内容错误!`)
  }
  bodyContent = interpolationHandle(bodyContent, pageScript)
  
  // 根据不同语言解析body内容
  const lang = getLang(headFileContent)
  bodyContent = register.readTemplate(bodyContent, lang)
  
  // 将文本转化为DOM元素
  const document = new JSDOM(bodyContent).window.document
  let body = document.body
  // 如果有owo事件则为其加上
  for (const key in pageInfo.prop) {
    if (pageInfo.prop.hasOwnProperty(key)) {
      const element = pageInfo.prop[key];
      if (key.startsWith('o-')) {
        body.children[0].setAttribute(key, element)
      }
    }
  }
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
          domBox.className += ` ${element}`
        } else {
          if (!propKey.startsWith('_')) domBox.setAttribute(propKey, element)
        }
      }
    }
  }
  // 如果模块除了prop还有其它函数方法，则必须设置template
  // console.log(pageScript)
  // 页面必定为其增加template标识
  // console.log(pageInfo.type)
  // console.log(pageScript)
  // 目前默认的属性有 prop 和 moduleType
  // 待优化 这种方式也太不靠谱了
  if (pageInfo.type !== 'plug' || Object.keys(pageScript).length > 2) {
    // 待优化 以后是不是可以去掉页面没有class时 强制要给它添加一个class
    if (domBox.classList.length === 0) domBox.classList.add(`owo-${assemblyName}`)
    // 添加模板标识
    domBox.setAttribute(pageInfo.type === 'route' ? 'route' : 'template', assemblyName)
  }
  

  // 如果是页面则为其加上id和class
  if (pageInfo.type === 'page') {
    domBox.classList.add(`page`)
    // 单页面不需要设置隐藏
    if (Config.pageList.length === 1) {
      domBox.style.display = 'block'
    } else {
      domBox.style.display = 'none'
    }
  } else if (pageInfo.type === 'block') {
    domBox.style.display = 'none'
    domBox.classList.add(`owo-block`)
  }
  bodyContent = domBox.outerHTML
  // 模板替换
  // console.log(bodyContent)
  // console.log('-------------------------------')
  // console.log(pageInfo.temple)
  htmlText = htmlText.replace(pageInfo.temple, bodyContent)
  // 防止样式重复打包
  if (!srcCache.includes(pageInfo.src)) {
    // 将结果保存到模板缓存中
    log.debug(`缓存模板: ${pageInfo.src}`)
    srcCache.push(pageInfo.src)
    // 模板插值处理
    headFileContent = interpolationHandle(headFileContent, pageScript)
    // 解析样式
    // 新一批的样式需要重启一行
    // 如果只有一个页面 那么样式不需要包裹页面那一层
    log.debug(`开始处理样式内容`)
    styleText += '\r\n' + Style(headFileContent, domBox.classList, domBox.localName, pageInfo.type === 'page' && Config.pageList.length < 2)
  } else {
    log.debug(`智能跳过打包${pageInfo.src}的重复样式!`)
  }
  return htmlText
}

// 从模板信息中获取模板的名字
function getPageName (pageInfo) {
  if (pageInfo.type === 'page' || pageInfo.type === 'block') {
    return pageInfo.name
  } else if (pageInfo.type === 'view') {
    return pageInfo.viewName
  } else {
    return pageInfo.templeName
  }
}

// 修改模板信息的名字
function setPageName (pageInfo, name) {
  if (pageInfo.type === 'page' || pageInfo.type === 'block') {
    pageInfo.name = name
  } else if (pageInfo.type === 'view') {
    pageInfo.viewName = name
  } else {
    pageInfo.templeName = name
  }
  return pageInfo
}

/**
 * 对文本格式的模板进行处理
 *
 * @param {string} pageInfo 页面的数据
 * @return {Object} 返回值描述
 */

function htmlTextHandle (pageInfo, htmlText, moduleScript) {
  // 计算页面的hash值
  const templeHash = crypto.createHash('md5').update(pageInfo.temple).digest('hex')
  // console.log(pageInfo)
  // 重名模块处理
  let pageNameIndex = 0
  // 取出页面或组件缓存
  // console.log(pageInfo)
  // 处理模块的名称和路径
  pageInfo.src = pageInfo.src || pageInfo.prop['_src'] || pageInfo.prop['src']
  if (!pageInfo.src) {
    throw Error(`找不到${pageInfo.name}的路径信息`)
  }
  
  // 页面或者模块的名称
  let assemblyName = getPageName(pageInfo)

  // 获取到函数应该放在哪个位置
  let scriptDataTemp = scriptData
  if (pageInfo.type === 'plug') scriptDataTemp = scriptData[pageInfo.name].template
  else if (pageInfo.type === 'route') scriptDataTemp = scriptData[pageInfo.name].view
  // console.log(scriptDataTemp)
  // 判断当前位置里是否已经有了同名函数
  if (scriptDataTemp) {
    
    while (assemblyName in scriptDataTemp) {
      pageNameIndex++
      // console.log(pageInfo.type !== 'plug' ? pageInfo.name : pageInfo.templeName)
      assemblyName = `${getPageName(pageInfo)}-${pageNameIndex}`
    }
    
    // 判断是否被更名过
    if (pageNameIndex > 0) {
      log.debug(`模块 ${getPageName(pageInfo)} 因名称重复被重命名为 ${assemblyName}`)
      pageInfo = setPageName(pageInfo, assemblyName)
    }
  }
  
  log.info(`开始处理模块: ${assemblyName} [${pageInfo.type}]`)
  

  // 模板文件内容
  let headFileContent = getFileContent(pageInfo)
  
  // 取出页面中的js内容
  let scriptText = Tool.cutString(headFileContent, "<script>", "</script>")
  let scriptCode = null
  if (scriptText !== null) {
    // 获取到模块Script回调
    scriptText = register.handleTemplateScript(scriptText)
    
    // 使用babel将页面JS和全局js分离开
    let ast = null
    try {
      ast = parse(scriptText, {sourceType: "module"});
    } catch (error) {
      throw '错误代码: ' + scriptText.slice(error.pos - 10, error.pos + 10)
    }
    
    let pageCode = ''
    for (let index = 0; index < ast.program.body.length; index++) {
      const element = ast.program.body[index];
      if (element.type === 'ExpressionStatement') {
        const tempCode = scriptText.slice(element.start, element.end)
        // 兼容module.exports模式
        if (tempCode.startsWith('module.exports')) {
          pageCode = tempCode
          scriptText = scriptText.replace(tempCode, '')
        }
      }
    }

    if (ast.program.body.length > 1) {
      log.warning(`${assemblyName} 有全局script代码!`)
      globalScript += `// 模块 ${assemblyName} 的script代码\r\n${scriptText}\r\n`
    }
    // console.log(scriptText)
    
    if (pageCode) {
      try {
        scriptCode = eval(pageCode)
      } catch (error) {
        console.error(pageCode)
        throw error
      }
    }
    
    // 判断缓存中是否有此模板,有的话不需要重新计算
    if (!scriptCode && htmlCache[templeHash]) {
      log.debug(`使用缓存返回模板: ${assemblyName}`)
      scriptHandle(pageInfo, scriptCache[templeHash], moduleScript)
      return htmlCache[templeHash]
    }
    // 判断data是否为特殊data
    if (scriptCode && typeof scriptCode.data === 'function') {
      Storage.plugList.add('special_data')
    }
  }

  // 存储当前页面的
  let pageScript = scriptHandle(pageInfo, scriptCode, moduleScript)
  
  // 如果页面没有js也为其创建一个空对象
  // name和src属性不需要打包在前端显示出来
  htmlCache[templeHash] = templateTextHandle(pageInfo, headFileContent, pageScript, scriptCode, assemblyName, htmlText)
  // console.log('---------------')
  // console.log(htmlCache[templeHash])
  scriptCache[templeHash] = scriptCode
  return htmlCache[templeHash]
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
  [scriptData, styleText, serverTempletMap, Config, htmlCache, srcCache, Storage.fileCache, fontList, hoverList, globalScript] = [{}, '', {}, config, {}, [], {}, {}, new Set(), '']
  // 将配置中的Script列表插入到dom中
  let templeData = ``
  let plugData = ``
  // 错误处理
  if (!config.pageList || config.pageList.length === 0) throw '配置项pageList页面数不能为空!'
  for (let ind = 0; ind < config.pageList.length; ind++) {
    const element = config.pageList[ind]
    if (config.pageList[ind].type == null || config.pageList[ind].type == undefined) {
      config.pageList[ind].type = "page"
      console.warn(`pageList 项目 ${element.name} 没有设置type值，已将其类型设置为page!`)
    }
    const type = config.pageList[ind].type
    // 判断是否为插件
    if (type === 'page') {
      const templeTemp = `<plug name="${element.name}" src="${element.src}" type="page"></plug>`
      templeData += `\r\n    <!-- 页面[${element.name}]-->\r\n    ${templeTemp}`
      config.pageList[ind].temple = templeTemp
    } else {
      const templeTemp = `<plug name="${element.name}" src="${element.src}" type="${type}"></plug>`
      plugData += `\r\n    <!-- 插件[${element.name}]-->\r\n    ${templeTemp}`
      config.pageList[ind].temple = templeTemp
    }
  }

  // 判断是否有包裹容器
  if (config.container) {
    templet = templet.replace('<!-- page-output -->', `<div class="${config.container}">${templeData}</div>${plugData}`)
  } else {
    templet = templet.replace('<!-- page-output -->', templeData + plugData)
  }
  
  // ---------------------- 页处理 ----------------------
  config.pageList.forEach(pageInfo => {
    const startTime = (new Date()).valueOf()
    templet = htmlTextHandle(pageInfo, templet, scriptData)
    log.debug(`页面${pageInfo.name || pageInfo.prop['_name'] || pageInfo.prop.name}处理用时: ${(new Date()).valueOf() - startTime} 毫秒!`)
  })
  // 处理用户脚本
  scriptData = register.HandleScriptEnd(scriptData)
  // 转换成纯文本
  let scriptDataText = Tool.fnStringify(scriptData)
  // 处理js中的链接
  if (config.handleLink) {
    // console.log(scriptDataText)
    scriptDataText = handleLink(scriptDataText, path.join(process.cwd(), config.outFolder) + '/static/resource/', './static/resource/')
  }
  let returnScriptData = `${globalScript}\r\nowo.script = ${scriptDataText}`
  if (Config.phoneEnter) {
    returnScriptData = `owo.phoneEnter = "${Config.phoneEnter}"\r\n` + returnScriptData
  }

  // 全局Ani设置
  if (config.globalAni) {
    Storage.plugList.add('globalAni')
    returnScriptData += `\r\nowo.globalAni = ${JSON.stringify(config.globalAni)}\r\n`
  }
  // 页面Ani设置
  if (config.pageAni && Object.keys(config.pageAni).length > 0) {
    Storage.plugList.add('pageAni')
    returnScriptData += `\r\nowo.pageAni = ${JSON.stringify(config.pageAni)}\r\n`
  }
  // 返回数据
  return {
    html: templet,
    style: styleText,
    hoverList,
    script: returnScriptData,
    serverTempletMap,
    fontList: fontList,
    // 用于判断如果没有任何页面的时候不需要一些函数
    noScript: checkNoScript(scriptData)
  }
}
module.exports = pageHandle