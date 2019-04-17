#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')

// 文件变动检测
const chokidar = require('chokidar')
const Tool = require('./lib/tool')
const Hrard = require('./lib/handle/hrard')
const Script = require('./lib/handle/script')
const Body = require('./lib/page/body')
const runProcess = require('child_process')

// html美化
const beautify_html = require('js-beautify').html;

// 命令行运行目录
const runPath = process.cwd()

// 配置输出插件
const log = require('./lib/log')()

// js预处理
const postcss      = require('postcss')
const precss = require('precss')
// css压缩
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')


// 资源文件处理
const resourceHandle = require('./lib/resource')
// 配置文件检测
const checkConfig = require('./lib/checkConfig')
const Cut = require('./lib/cut')

// Web 框架
const express = require('express')
const app = express()
// 使express处理ws请求
const wsServe = require('express-ws')(app)


// 打包的版本号
let version = ''

// 判断使用哪套配置文件
const processArgv = process.argv[2]
// 判断是否为生成脚手架
if (processArgv === 'init') {
  console.log('正在生成实例!')
  runProcess.exec(`git clone https://github.com/owo/example ${process.argv[3] ? process.argv[3] : example}`,function (error, stdout, stderr) {
    if (error !== null) {
      console.log('exec error: ' + error)
      return
    }
    console.log('示例生成成功!')
    console.log(`请运行 cd ./${process.argv[3] ? process.argv[3] : example}`)
    console.log('并运行npm i 或 yarn 安装依赖包')
    console.log('使用pack dev测试运行')
    console.log('使用pack build打包页面')
    console.log('配置信息储存在目录下owo.js中!')
  })
  return
}


let startTime = null

// 当前打包的模板
let htmlTemple = ''
// 当前打包的动画样式
let animationList = new Set()

// 判断运行目录下是否包含配置文件
if (!fs.readFileSync(path.join(runPath, 'owo.js'))) {
  log.error('owo.js file does not exist!')
  close()
}

// 读取配置文件
let config = eval(fs.readFileSync(path.join(runPath, 'owo.js'), 'utf8'))


// 判断是否处于生成模式
if (processArgv) {
  if (config[processArgv]) {
    // 深拷贝
    const processConfig = JSON.parse(JSON.stringify(config[processArgv]))
    config = Object.assign(processConfig, config)
  } else {
    log.error(`config name ${processArgv} not found in owo.js!`)
    return
  }
}

log.debug('获取到配置信息:')
log.debug(config)
if (!checkConfig(config)) {
  return
}

// 输出目录
const outPutPath = path.join(runPath, config.outFolder)
const corePath = path.join(__dirname, 'core')

// 静态资源前缀
const basePath = config.basePath || './'
// 静态资源输出目录
const staticPath = path.join(outPutPath, 'static')

// 处理style
function handleStyle(dom, changePath) {
  let styleData = ''
  // 添加入框架内置样式
  const mainStyle = path.join(corePath, `main.css`)
  let outPutCss = Tool.loadFile(mainStyle) + `\r\n` + dom.style
  // --------------------------------- 动画效果 ---------------------------------------------
  dom.useAnimationList.forEach(element => {
    animationList.add(element)
  })
  // 处理css中的资源文件
  if (config.resourceFolder) {
    const resourceFolder = path.join(runPath, config.resourceFolder)
    outPutCss = resourceHandle(outPutCss, resourceFolder, path.join(staticPath, 'resource'), `${basePath}static/resource/`)
  }
  // ----------------------------------------------- 使用postcss处理 -----------------------------------------------
  // 自动加浏览器前缀
  // console.log(autoprefixer.process)
  let plugList = [precss, autoprefixer]
  // 判断是否压缩优化css
  if (config.minifyCss) {
    plugList.push(cssnano)
  }

  postcss(plugList).process(outPutCss, { from: undefined, cascade: true }).then( (result) => {
    // console.log(result)
    result.warnings().forEach((warn) => {
      console.warn(warn.toString());
    })
    // console.log('css处理完毕!')
    dom.style = result.css
    // ----------------------------------------------- 输出css -----------------------------------------------
    styleData += `<!-- 页面主样式文件 -->\r\n<style>\r\n${dom.style}\r\n</style>`

    // 处理需要经过特殊处理的css文件
    log.debug('需要经过特殊处理的css: ', dom.needReplaceCssList)
    dom.needReplaceCssList.forEach(element => {
      styleData = Tool.replaceAll(styleData, element[0], element[1])
    })
    // 美化css样式
    styleData = Tool.replaceAll(styleData, `\n`, `\n      `)
    styleData = Tool.replaceAll(styleData, `  <style>`, `<style>`)
    styleData = Tool.replaceAll(styleData, `  </style>`, `</style>`)

    let completeNum = 0
    
    // 如果没有额外的css直接输出
    if (!config.styleList || config.styleList.length === 0) {
      htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
      outPutHtml()
      return
    } else {
      Tool.creatDirIfNotExist(path.join(staticPath, 'css'))
      styleData += `\r\n    <!-- 附属css文件 -->`
    }
    for (let ind = 0; ind < config.styleList.length; ind++) {
      const element = config.styleList[ind]
      // 判断是设置了路径
      if (!element.src) {
        console.error('style path unset!', element)
        continue
      }
      // -------------sdsd---------------------------------------------------------
      // 如果是网络地址那么不需要进行处理
      if (element.src.startsWith('http')) {
        styleData += `\r\n    <link rel="stylesheet" href="${element.src}">`
        if (++completeNum >= config.styleList.length) {
          htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
          outPutHtml()
        }
        
        continue
      } else {
        styleData += `\r\n    <link rel="stylesheet" href="${basePath}static/css/${element.name}.css">`
      }
      // 输出路径
      const outPutFile = path.join(staticPath, 'css', `${element.name}.css`)
      const fromPath = path.join(runPath, element.src)
      if (changePath === undefined || changePath === fromPath) {
        // 判断是否需要处理资源
        if (element.resource) {
          // 处理资源并移动
          const resourceFolder = path.join(runPath, config.resourceFolder)
          fs.readFile(fromPath, (err, fileData) => {
            log.info(`读取成功: ${fromPath}`)
            if (err) throw err
            fileData = resourceHandle(fileData.toString(), resourceFolder, path.join(staticPath, 'resource'), `.${basePath}resource/`)
            fs.writeFile(outPutFile, fileData, () => {
              log.info(`写入文件: ${outPutFile}`)
            })
          })
        } else {
          // 不需要处理则直接移动就可以了
          Tool.moveFile(fromPath, outPutFile)
        }
      }
      if (++completeNum >= config.styleList.length) {
        htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
        outPutHtml()
      }
    }
  })
}

// 输出script
function outPutScript (scriptData) {
  // 版本号后缀
  const versionString = config.outPut.addVersion ? `.${version}` : ''

  scriptData += `\r\n    <!-- 主要script文件 -->\r\n    <script src="${basePath}static/js/owo.main${versionString}.js" type="text/javascript"></script>`

  htmlTemple = htmlTemple.replace(`<!-- script-output -->`, scriptData)
  outPutHtml()
}

// 输出页面切换动画
function outPutAnimation () {
  // 判断“动画”集合是否为空
  if (animationList.size === 0) {
    htmlTemple = htmlTemple.replace(`<!-- animation-output -->`, '')
  } else {
    let animationData = ''
    const versionString = config.outPut.addVersion ? `.${version}` : ''
    animationList.forEach(animationName => {
      const animationFilePath = path.join(corePath, 'animation', `${animationName}.css`)
      animationData += Tool.loadFile(animationFilePath) + '\r\n'
    })
    // 输出动画样式文件
    const animationPath = path.join(staticPath, 'css', `owo.animation${versionString}.css`)
    Tool.creatDirIfNotExist(path.join(staticPath, 'css'))
    log.info(`写文件: ${animationPath}`)
    fs.writeFileSync(animationPath, animationData)
    htmlTemple = htmlTemple.replace(`<!-- animation-output -->`, `<link rel="stylesheet" href="${basePath}static/css/owo.animation${versionString}.css">`)
  }
}

// 处理script
function handleScript (dom, changePath) {
  // 版本号后缀
  const versionString = config.outPut.addVersion ? `.${version}` : ''
  // 根据不同情况使用不同的core
  // 读取出核心代码
  let coreScript = Tool.loadFile(path.join(corePath, 'main.js'))
  if (config.pageList.length === 1) {
    // 单页面
    log.info('工程中只有一个页面!')
    coreScript += Tool.loadFile(path.join(corePath, 'SinglePage.js'))
  } else {
    // 多页面
    log.info('工程中包含多个页面!')
    coreScript += Tool.loadFile(path.join(corePath, 'MultiPage.js'))
  }
  // 页面切换特效
  // 处理使用到的特效
  let useAnimationList = Cut.stringArray(coreScript, '$go(', ')')
  // 遍历特效函数
  useAnimationList.forEach(element => {
    element = element.replace(/"/g, '')
    element = element.replace(/'/g, '')
    element = element.replace(/ /g, '')
    // 取出每一个参数
    const parameterList = element.split(',')
    if (parameterList[1]) {
      // 一个动画里面可能有多个动画
      const temp = parameterList[1].split('&')
      temp.forEach(animation => {
        animationList.add(animation)
      })
    }
    if (parameterList[2]) {
      // 一个动画里面可能有多个动画
      const temp = parameterList[2].split('&')
      temp.forEach(animation => {
        animationList.add(animation)
      })
    }
  })
  
  outPutAnimation()
  // console.log(animationList.size)
  // 取出js中的页面切换特效
  if (animationList.size > 0) {
    log.info('包含有页面切换动画!')
    log.info(`动画列表: ${Array.from(animationList)}`)
    coreScript += Tool.loadFile(path.join(corePath, 'animation.js'))
  } else {
    log.debug('页面中不包含切换动画!')
    coreScript += Tool.loadFile(path.join(corePath, 'noAnimation.js'))
  }
  
  // 处理使用到的方法
  let toolList = Cut.stringArray(dom.script, 'owo.tool.', '(')
  let toolList2 = Cut.stringArray(dom.script, '$tool.', '(')
  // 数组去重
  toolList = new Set(toolList.concat(toolList2))
  toolList.forEach(element => {
    // console.log(element)
    coreScript += Tool.loadFile(path.join(corePath, 'tool', `${element}.js`))
  })
  // 使用bable处理代码
  let mainScript = Script(coreScript, config.outPut.minifyJs).code

  // ----------------------------------------------- 输出js -----------------------------------------------
  const scriptDir = path.join(staticPath, 'js')
  // 判断并创建js目录
  Tool.creatDirIfNotExist(scriptDir)
  let scriptData = `<!-- owo框架代码 --><script>${Script(dom.script).code}</script>`
  
  // 判断是否输出时间
  if (config.outPut.addTime) {
    mainScript = `// ${new Date().toString()}\r\n` + mainScript
  }
  // 处理js中的资源
  if (config.resourceFolder) {
    mainScript = resourceHandle(mainScript, path.join(runPath, config.resourceFolder), path.join(staticPath, 'resource'), `${basePath}static/resource/`)
  }
  // 写出主要硬盘文件
  fs.writeFileSync(path.join(staticPath, 'js' , `owo.main${versionString}.js`), mainScript)
  
  // 判断是否需要加入自动刷新代码
  if (config.autoReload) {
    if (!changePath) {
      Tool.moveFile(path.join(corePath, 'debug', 'autoReload.js'), path.join(staticPath, 'js', `autoReload.js`))
    }
    scriptData += `\r\n    <script src="${basePath}static/js/autoReload.js" type="text/javascript"></script>`
  }
  log.debug(`处理引用脚本: ${JSON.stringify(config.scriptList)}`)
  // 处理引用的script
  if (config.scriptList && config.scriptList.length > 0) {
    log.debug(`外部脚本数量: ${config.scriptList.length}`)
    // 遍历引用列表
    let completeNum = 0
    for (let ind = 0; ind < config.scriptList.length; ind++) {
      const element = config.scriptList[ind]
      // console.log(element)
      log.debug(`处理脚本: ${element.name}`)
      // 判断是设置了路径
      if (!element.src) {
        log.error('script path unset!', element)
        continue
      }
      // 如果是网络地址那么不需要进行处理
      if (element.src.startsWith('http')) {
        log.debug(`网络脚本: ${element.name}`)
        scriptData += `\r\n    <script src="${element.src}" type="text/javascript" ${element.defer ? 'defer="defer"' : ''}></script>`
        // 判断是否为最后项,如果为最后一项则输出script
        if (++completeNum >= config.scriptList.length) {
          log.debug(`完成外部脚本引用处理!`)
          outPutScript(scriptData)
        }
        continue
      } else {
        scriptData += `\r\n    <script src="${basePath}static/js/${element.name}.js" type="text/javascript" ${element.defer ? 'defer="defer"' : ''}></script>`
      }
      // 输出路径
      const outPutFile = path.join(staticPath, 'js', `${element.name}.js`)
      
      // 判断是否用babel处理
      if (element.babel) {
        log.debug('使用bable处理脚本!')
        if (changePath === undefined || changePath === path.join(runPath, element.src)) {
          fs.readFile(path.join(runPath, element.src), (err, fileData) => {
            if (err) throw err
            fs.writeFile(outPutFile, Script(fileData, config.outPut.minifyJs).code, () => {
              log.info(`使用babel处理并生成文件: ${outPutFile}`)
              // 判断是否为最后项,如果为最后一项则输出script
              if (++completeNum >= config.scriptList.length) {
                outPutScript(scriptData)
              }
            })
          })
        } else {
          if (++completeNum >= config.scriptList.length) {
            outPutScript(scriptData)
          }
        }
      } else {
        log.debug('不使用bable处理脚本!')
        // 如果不使用babel处理则进行复制文件
        if (changePath === undefined || changePath === path.join(runPath, element.src)) {
          Tool.moveFile(path.join(runPath, element.src), outPutFile)
        }
        if (++completeNum >= config.scriptList.length) {
          outPutScript(scriptData)
        }
      }
    }
  } else {
    log.debug('没有使用到外部脚本!')
    // 如果没有引用script，则直接输出html
    outPutScript(scriptData)
  }
}


function outPutHtml () {
  log.debug('判断是否可以输出Html!')
  // 如果文档中已经不存在output那么证明已经可以进行输出了
  if (!htmlTemple.includes('-output -->')) {
    log.debug('准备输出html!')
    // 判断是否输出时间
    if (config.outPut.addTime) {
      htmlTemple = htmlTemple + `\r\n<!-- ${new Date().toString()} -->`
    }
    // 对html所引用的资源进行处理
    if (config.resourceFolder) {
      htmlTemple = resourceHandle(htmlTemple, path.join(runPath, config.resourceFolder), path.join(staticPath, 'resource'), `${basePath}static/resource/`)
    }
    // 美化html
    log.debug('开始美化html')
    const beautifyHtml = beautify_html(htmlTemple, {
      indent_size: 2,
      inline: [
        "abbr", "area", "audio", "b", "bdi", "bdo", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "dfn", "em", "i", "iframe", "input", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript", "object", "output", "progress", "q", "ruby", "s", "samp", "select", "small", "strong", "sub", "sup", "svg", "template", "textarea", "time", "u", "var", "wbr", "text", "acronym", "address", "big", "dt", "ins", "strike", "tt"
      ],
      space_in_empty_paren: false
    })
    // 写出文件
    fs.writeFileSync(path.join(outPutPath, 'index.html'), beautifyHtml)
    console.log(`Compile successfully, Use time: ${new Date().getTime() - startTime} msec!`)
    
    if (config.autoReload) {
      log.info(`发送重新页面需要刷新命令!`)
      // 广播发送重新打包消息
      wsServe.getWss().clients.forEach(client => client.send('reload'))
    }
  } else {
    log.debug('还有没有经过处理的资源!')
    // log.debug(htmlTemple)
  }
}

// 执行默认打包任务
function pack(changePath) {
  
  // 记录开始打包时间
  startTime = new Date().getTime()
  log.info(`--------------------------- 开始编译 ---------------------------`)
  // 输出运行目录
  log.info(`程序运行目录: ${runPath}`)
  
  
  
  // 判断是否为更新
  if (!changePath) {
    log.info(`首次启动!`)
    // 生成版本号
    version = Math.random().toString(36).substr(2)
    log.info(`生成版本号: ${version}`)
    // 清空静态文件目录
    if (fs.existsSync(staticPath)) {
      Tool.delDir(staticPath)
      log.info(`清理资源文件夹: ${staticPath}`)
    }
    // 创建目录
    Tool.creatDirIfNotExist(outPutPath)
    Tool.creatDirIfNotExist(staticPath)
  } else {
    log.info(`刷新模式,变化目录: ${changePath}`)
  }

  
  
  // 读取入口模板文件(一次性读取到内存中)
  const templeFile = path.join(__dirname, 'index.html')
  log.info(`读取模板文件: ${templeFile}`)
  htmlTemple = fs.readFileSync(templeFile, 'utf8')

  // 处理title
  log.debug(`读取网页标题: ${config.title}`)
  htmlTemple = htmlTemple.replace('{{title}}', config.title || 'owo')

  log.debug(`处理页面源信息: ${JSON.stringify(config.headList)}`)

  htmlTemple = Hrard(config.headList, htmlTemple)

  const dom = Body(htmlTemple, config)
  htmlTemple = dom.html
  // 处理style
  handleStyle(dom, changePath)
  // 处理script
  handleScript(dom, changePath)
}

// 开始打包
pack()

// 判断是否开启文件变动自动重新打包
if (config.watcher && config.watcher.enable) {
  let watcherFolder = config.root
  watcherFolder = path.join(runPath, watcherFolder)
  log.info(`监控文件夹变化: ${watcherFolder}`)
  // 文件变动检测
  const watcher = chokidar.watch(watcherFolder, {
    // 忽略目录
    ignored: config.watcher.ignored ? config.watcher.ignored : config.outFolder + '/*',
    persistent: true,
    usePolling: true,
    // 检测深度
    depth: config.watcher.depth
  })

  watcher.on('change', changePath => {
    log.info(`file change: ${changePath}`)
    // 重新打包
    pack(changePath)
  })
}

// 判断是否启用静态文件服务
if (config.server) {
  app.use(express.static(path.join(runPath, config.outFolder)))
}


// 处理websocket消息
if (config.autoReload) {
  app.ws('/', function(ws, req) {
    ws.on('message', function(msg) {
      console.log(ws);
    })
  })
}


if (config.server || config.autoReload) {
  const port = config.serverPort || 8000
  app.listen(port)
  log.info(`服务器运行在: 127.0.0.1:${port}`)
}
