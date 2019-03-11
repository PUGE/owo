#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
// 文件变动检测
const chokidar = require('chokidar')
const Tool = require('./lib/tool')
const Hrard = require('./lib/handle/hrard')
const Script = require('./lib/handle/script')
const Body = require('./lib/handle/body')
// 日志输出
const log4js = require('log4js')

// 输出到文件
log4js.configure({
  appenders: {
    cheese: {
      type: 'file',
      filename: 'ozzx.log'
    }
  },
  categories: {
    default: {
      appenders: ['cheese'],
      level: 'all'
    }
  }
})
const logger = log4js.getLogger('main.js')

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

// 配置日志输出等级
// logger.level = 'debug'
logger.level = 'all'

// 命令行运行目录
const runPath = process.cwd()
let startTime = null

// 当前打包的模板
let htmlTemple = ''
// 当前打包的动画样式
let animationList = new Set()

let animationData = ''

// 判断运行目录下是否包含配置文件
if (!fs.readFileSync(path.join(runPath, 'ozzx.js'))) {
  logger.error('ozzx.js file does not exist!')
  close()
}

// 读取配置文件
let config = eval(fs.readFileSync(path.join(runPath, 'ozzx.js'), 'utf8'))

// 判断使用哪套配置文件
const processArgv = process.argv[2]
if (processArgv) {
  if (config[processArgv]) {
    // 深拷贝
    const processConfig = JSON.parse(JSON.stringify(config[processArgv]))
    config = Object.assign(processConfig, config)
  } else {
    logger.error(`config name ${processArgv} not found in ozzx.js!`)
    return
  }
}

if (!checkConfig(config)) {
  return
}

// 输出目录
const outPutPath = path.join(runPath, config.outFolder)
const corePath = path.join(__dirname, 'core')

// 静态资源输出目录
const staticPath = path.join(outPutPath, 'static')

// 读取指定目录文件
function loadFile(path) {
  if (fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8')
  } else {
    logger.error(`file does not exist: ${path}`)
    return ''
  }
}

// 处理style
function handleStyle(dom, changePath) {
  let styleData = ''
  // 版本号后缀
  const versionString = config.outPut.addVersion ? `.${version}` : ''
  // 添加入框架内置样式
  const mainStyle = path.join(corePath, `main.css`)
  let outPutCss = loadFile(mainStyle) + `\r\n` + dom.style
  
  // --------------------------------- 动画效果 ---------------------------------------------
  dom.useAnimationList.forEach(element => {
    animationList.add(element)
  })
  // 处理css中的资源文件
  if (config.resourceFolder) {
    const resourceFolder = path.join(runPath, config.resourceFolder)
    outPutCss = resourceHandle(outPutCss, resourceFolder, path.join(staticPath, 'resource'), '../resource/')
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
    const styleDir = path.join(staticPath, 'css')
    result.warnings().forEach((warn) => {
      console.warn(warn.toString());
    })
    // console.log('css处理完毕!')
    dom.style = result.css
    // ----------------------------------------------- 输出css -----------------------------------------------
    
    styleData += `<!-- 页面主样式文件 -->\r\n    <link rel="stylesheet" href="./static/css/ozzx.main${versionString}.css">`
    
    // 判断是否输出时间
    if (config.outPut.addTime) {
      dom.style = `/* ${new Date().toString()} */\r\n` + dom.style
    }
    fs.writeFileSync(path.join(staticPath, 'css', `ozzx.main${versionString}.css`), dom.style)


    let completeNum = 0
    
    // 如果没有额外的css直接输出
    if (!config.styleList || config.styleList.length === 0) {
      htmlTemple = htmlTemple.replace(`<!-- css-output -->`, styleData)
      outPutHtml()
      return
    } else {
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
        styleData += `\r\n    <link rel="stylesheet" href="./static/css/${element.name}.css">`
      }
      // 输出路径
      const outPutFile = path.join(staticPath, 'css', `${element.name}.css`)
      if (changePath === undefined || changePath === path.join(runPath, element.src)) {
        Tool.moveFile(path.join(runPath, element.src), outPutFile)
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

  
  scriptData += `\r\n    <!-- 主要script文件 -->\r\n    <script src="./static/js/ozzx.main${versionString}.js" type="text/javascript"></script>`
  // console.log(scriptData)
  htmlTemple = htmlTemple.replace(`<!-- script-output -->`, scriptData)
  outPutHtml()
}

// 输出页面切换动画
function outPutAnimation () {
  if (animationList.length === 0) {
    htmlTemple = htmlTemple.replace(`<!-- animation-output -->`, '')
  } else {
    const versionString = config.outPut.addVersion ? `.${version}` : ''
    animationList.forEach(animationName => {
      const animationFilePath = path.join(corePath, 'animation', `${animationName}.css`)
      animationData += loadFile(animationFilePath)
    })
    // 输出动画样式文件
    const animationPath = path.join(staticPath, 'css', `ozzx.animation${versionString}.css`)
    Tool.creatDirIfNotExist(path.join(staticPath, 'css'))
    logger.info(`写文件: ${animationPath}`)
    fs.writeFileSync(animationPath, animationData)
    htmlTemple = htmlTemple.replace(`<!-- animation-output -->`, `<link rel="stylesheet" href="./static/css/ozzx.animation${versionString}.css">`)
  }
}

// 处理script
function handleScript (dom, changePath) {
  // 版本号后缀
  const versionString = config.outPut.addVersion ? `.${version}` : ''
  // 根据不同情况使用不同的core
  // 读取出核心代码
  let coreScript = loadFile(path.join(corePath, 'main.js'))
  if (config.pageList.length === 1) {
    // 单页面
    coreScript += loadFile(path.join(corePath, 'SinglePage.js'))
  } else {
    // 多页面
    logger.info('工程中包含多个页面!')
    coreScript += loadFile(path.join(corePath, 'MultiPage.js'))
  }
  // 整合页面代码
  coreScript += dom.script
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
      animationList.add(parameterList[1])
    }
    if (parameterList[2]) {
      animationList.add(parameterList[2])
    }
    
  })
  
  outPutAnimation()
  // console.log(animationList.size)
  // 取出js中的页面切换特效
  if (animationList.size > 0) {
    logger.info('项目中包含有页面切换动画!')
    coreScript += loadFile(path.join(corePath, 'animation.js'))
  }
  
  // 处理使用到的方法
  let toolList = Cut.stringArray(coreScript, 'ozzx.tool.', '(')
  let toolList2 = Cut.stringArray(coreScript, '$tool.', '(')
  // 数组去重
  toolList = new Set(toolList.concat(toolList2))
  toolList.forEach(element => {
    // console.log(element)
    coreScript += loadFile(path.join(corePath, 'tool', `${element}.js`))
  })
  // 使用bable处理代码
  dom.script = Script(coreScript, config.outPut.minifyJs).code

  // ----------------------------------------------- 输出js -----------------------------------------------
  const scriptDir = path.join(staticPath, 'js')
  // 判断并创建js目录
  Tool.creatDirIfNotExist(scriptDir)
  let scriptData = '<!-- 页面脚本 -->'
  
  // 判断是否输出时间
  if (config.outPut.addTime) {
    dom.script = `// ${new Date().toString()}\r\n` + dom.script
  }
  // 处理js中的资源
  if (config.resourceFolder) {
    dom.script = resourceHandle(dom.script, path.join(runPath, config.resourceFolder), path.join(staticPath, 'resource'), './static/resource/')
  }
  // 写出主要硬盘文件
  fs.writeFileSync(path.join(staticPath, 'js' , `ozzx.main${versionString}.js`), dom.script)
  
  // 判断是否需要加入自动刷新代码
  if (config.autoReload) {
    if (!changePath) {
      Tool.moveFile(path.join(corePath, 'debug', 'autoReload.js'), path.join(staticPath, 'js', `autoReload.js`))
    }
    scriptData += '\r\n    <script src="./static/js/autoReload.js" type="text/javascript"></script>'
  }

  // 处理引用的script
  if (config.scriptList && config.scriptList.length > 0) {
    // 遍历引用列表
    let completeNum = 0
    for (let ind = 0; ind < config.scriptList.length; ind++) {
      const element = config.scriptList[ind]
      // console.log(element)
      
      // 判断是设置了路径
      if (!element.src) {
        logger.error('script path unset!', element)
        continue
      }
      // 如果是网络地址那么不需要进行处理
      if (element.src.startsWith('http')) {
        scriptData += `\r\n    <script src="${element.src}" type="text/javascript" ${element.defer ? 'defer="defer"' : ''}></script>`
        // 判断是否为最后项,如果为最后一项则输出script
        if (++completeNum >= config.scriptList.length) {
          outPutScript(scriptData)
        }
        continue
      } else {
        scriptData += `\r\n    <script src="./static/js/${element.name}.js" type="text/javascript" ${element.defer ? 'defer="defer"' : ''}></script>`
      }
      // 输出路径
      const outPutFile = path.join(staticPath, 'js', `${element.name}.js`)
      // 判断是否用babel处理
      if (element.babel) {
        if (changePath === undefined || changePath === path.join(runPath, element.src)) {
          fs.readFile(path.join(runPath, element.src), (err, fileData) => {
            if (err) throw err
            fs.writeFile(outPutFile, Script(fileData, config.outPut.minifyJs).code, () => {
              logger.info(`使用babel处理并生成文件: ${outPutFile}`)
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
    // 如果没有引用script，则直接输出html
    outPutScript(scriptData)
  }
}


function outPutHtml () {
  // 如果文档中已经不存在output那么证明已经可以进行输出了
  if (!htmlTemple.includes('output')) {
    // 判断是否输出时间
    if (config.outPut.addTime) {
      htmlTemple = htmlTemple + `\r\n<!-- ${new Date().toString()} -->`
    }
    // 对html所引用的资源进行处理
    if (config.resourceFolder) {
      htmlTemple = resourceHandle(htmlTemple, path.join(runPath, config.resourceFolder), path.join(staticPath, 'resource'), './static/resource/')
    }
    
    // 写出文件
    fs.writeFileSync(path.join(outPutPath, 'index.html'), htmlTemple)
    logger.info(`编译成功! 用时: ${new Date().getTime() - startTime}`)

    if (config.autoReload) {
      // 广播发送重新打包消息
      wsServe.getWss().clients.forEach(client => client.send('reload'))
    }
  }
}

// 执行默认打包任务
function pack (changePath) {
  
  // 记录开始打包时间
  startTime = new Date().getTime()
  logger.info(`--------------------------- 开始编译 ---------------------------`)
  // 输出运行目录
  logger.info(`程序运行目录: ${runPath}`)
  
  
  
  // 判断是否为更新
  if (!changePath) {
    logger.info(`首次启动!`)
    // 生成版本号
    version = Math.random().toString(36).substr(2)
    logger.info(`生成版本号: ${version}`)
    // 清空静态文件目录
    if (fs.existsSync(staticPath)) {
      Tool.delDir(staticPath)
      logger.info(`清理资源文件夹: ${staticPath}`)
    }
    // 创建目录
    Tool.creatDirIfNotExist(outPutPath)
    Tool.creatDirIfNotExist(staticPath)
  } else {
    logger.info(`刷新模式,变化目录: ${changePath}`)
  }

  
  
  // 读取入口模板文件(一次性读取到内存中)
  const templeFile = path.join(__dirname, 'index.html')
  logger.info(`读取模板文件: ${templeFile}`)
  htmlTemple = fs.readFileSync(templeFile, 'utf8')

  // 处理title
  logger.debug(`读取网页标题: ${config.title}`)
  htmlTemple = htmlTemple.replace('{{title}}', config.title || 'ozzx')

  logger.debug(`处理页面源信息: ${JSON.stringify(config.headList)}`)

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
  let watcherFolder = config.watcher.folder
  if (!watcherFolder) {
    watcherFolder = './src'
    logger.error('watcher is enable, but watcher.folder not set! use default value: "./src"')
  } else {
    watcherFolder = path.join(runPath, watcherFolder)
    logger.info(`watcher folder: ${watcherFolder}`)
  }
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
    logger.info(`file change: ${changePath}`)
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
  logger.info(`服务器运行在: 127.0.0.1:${port}`)
}
