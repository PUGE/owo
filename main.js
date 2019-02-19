#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
// 文件变动检测
const chokidar = require('chokidar')

const Script = require('./lib/script')
// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

// js预处理
const postcss      = require('postcss')
const precss = require('precss')
// css压缩
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')

const bodyHandle = require('./lib/page')
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
logger.level = 'info'

// 命令行运行目录
const runPath = process.cwd()
let startTime = null

// 判断运行目录下是否包含配置文件
if (!fs.readFileSync(path.join(runPath, 'ozzx.js'))) {
  logger.error('ozzx.js file does not exist!')
  close()
}

// 读取配置文件
const config = eval(fs.readFileSync(path.join(runPath, 'ozzx.js'), 'utf8'))

// 输出目录
const outPutPath = path.join(runPath, config.outFolder)
const corePath = path.join(__dirname, 'core')

// 读取指定目录文件
function loadFile(path) {
  if (fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8')
  } else {
    logger.error(`file does not exist: ${path}`)
    return ''
  }
}

// 判断目录是否存在，如果不存在则创建
function creatIfNotExist(pathStr) {
  if (!fs.existsSync(pathStr)) {
    fs.mkdirSync(pathStr)
  }
}

// 处理style
function handleStyle(dom) {
  // 读取出全局样式
  const mainStyle = fs.readFileSync(path.join(runPath, config.globalStyle), 'utf8') + '\r\n'
  // console.log(mainStyle)
  // 混合css
  let outPutCss = mainStyle + dom.style
  logger.debug(dom.useAnimationList)
  
  // --------------------------------- 动画效果 ---------------------------------------------
  // 判断是自动判断使用的动画效果还是用户指定
  if (config.choiceAnimation) {
    logger.debug('用户设置加载全部动画效果!')
    // 加载全部特效
    const animationFilePath = path.join(corePath, 'animation', `animations.css`)
    outPutCss += loadFile(animationFilePath)
  } else {
    dom.useAnimationList.forEach(animationName => {
      const animationFilePath = path.join(corePath, 'animation', `${animationName}.css`)
      outPutCss += loadFile(animationFilePath)
    })
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
    result.warnings().forEach((warn) => {
      console.warn(warn.toString());
    })
    // console.log('css处理完毕!')
    dom.style = result.css
    // ----------------------------------------------- 输出css -----------------------------------------------
    // 判断输出目录是否存在,如果不存在则创建目录
    creatIfNotExist(path.join(outPutPath, 'css'))
    fs.writeFileSync(path.join(outPutPath, 'css', 'main.css'), dom.style)
  })
}

// 处理heard
function handleHrard(templet, headList) {
  // 取出所有Heard标识
  let heardData = '<!-- 页面的元信息 -->'
  headList.forEach(element => {
    let heard = `\r\n    <meta`
    for (const key in element) {
      const value = element[key]
      heard += ` ${key}="${value}"`
    }
    heard += `/>`
    heardData += `${heard}`
  })
  templet = templet.replace(`<!-- *head* -->`, heardData)
  return templet
}

// 复制文件到指定路径
function moveFile (fromPath, toPath) {
  fs.readFile(fromPath, (err, fileData) => {
    if (err) throw err
    fs.writeFile(toPath, fileData, () => {
      logger.info(`copy file: ${toPath}`)
    })
  })
}

// 处理script
function handleScript (dom) {
  // 版本号后缀
  const versionString = config.outFileAddVersion ? `-${version}` : ''
  // 根据不同情况使用不同的core
  // 读取出核心代码
  let coreScript = loadFile(path.join(corePath, 'main.js'))
  if (dom.isOnePage) {
    // 单页面
    coreScript += loadFile(path.join(corePath, 'SinglePage.js'))
  } else {
    // 多页面
    coreScript += loadFile(path.join(corePath, 'MultiPage.js'))
  }
  // 页面切换特效
  // 判断是否存在页面切换特效
  if (dom.useAnimationList.length > 0 || config.choiceAnimation) {
    coreScript += loadFile(path.join(corePath, 'animation.js'))
  }
  // 整合页面代码
  coreScript += dom.script
  // 处理使用到的方法
  let toolList = Cut.stringArray(coreScript, 'ozzx.tool.', '(')
  // 数组去重
  toolList = new Set(toolList)
  toolList.forEach(element => {
    // console.log(element)
    coreScript += loadFile(path.join(corePath, 'tool', `${element}.js`))
  })
  
  // 使用bable处理代码
  dom.script = Script(coreScript, config.minifyJs).code

  // ----------------------------------------------- 输出js -----------------------------------------------
  let scriptData = '<!-- 页面脚本 -->'
  // 判断并创建目录
  creatIfNotExist(path.join(outPutPath, 'js'))
  fs.writeFileSync(path.join(outPutPath, 'js' , `main${versionString}.js`), dom.script)
  
  scriptData += `\r\n    <script src="./js/main${versionString}.js" type="text/javascript"></script>`
  // 判断是否需要加入自动刷新代码
  if (config.autoReload) {
    moveFile(path.join(corePath, 'debug', 'autoReload.js'), path.join(outPutPath, 'js', `autoReload.js`))
    scriptData += '\r\n    <script src="./js/autoReload.js" type="text/javascript"></script>'
  }

  // 处理引用的script
  if (config.scriptList) {
    // 遍历引用列表
    let completeNum = 0
    config.scriptList.forEach(element => {
      // 输出路径
      const outPutFile = path.join(outPutPath, 'js', `${element.name}${versionString}.js`)
      // 判断是设置了路径
      if (element.src) {
        // 判断是否用babel处理
        if (element.babel) {
          fs.readFile(path.join(runPath, element.src), (err, fileData) => {
            if (err) throw err
            fs.writeFile(outPutFile, Script(fileData, config.minifyJs).code, () => {
              logger.info(`bable and out put file: ${outPutFile}`)
              
              scriptData += `\r\n    <script src="./js/${element.name}${versionString}.js" type="text/javascript" ${element.defer ? 'defer="defer"' : ''}></script>`
              // 判断是否为最后项,如果为最后一项则输出script
              if (++completeNum === config.scriptList.length) {
                outPutHtml(dom.html.replace(`<!-- script-output -->`, scriptData))
                logger.info(`Package success! use time ${new Date().getTime() - startTime}`)
                if (config.autoReload) {
                  // 广播发送重新打包消息
                  wsServe.getWss().clients.forEach(client => client.send('reload'))
                }
              }
            })
          })
        } else {
          // 如果不使用babel处理则进行复制文件
          moveFile(path.join(runPath, element.src), outPutFile)
        }
        
      } else {
        console.error('script path unset!', element)
      }
    })
  }
}


function outPutHtml (htmlData) {
  fs.writeFileSync(path.join(outPutPath, 'index.html'), htmlData)
}
// 执行默认打包任务
function pack () {
  // 生成版本号
  version = Math.random().toString(36).substr(2)
  // 判断输出目录是否存在,如果不存在则创建目录
  if (!fs.existsSync(outPutPath)) {
    fs.mkdirSync(outPutPath)
  }
  // 记录开始打包时间
  startTime = new Date().getTime()
  
  // 读取入口模板文件(一次性读取到内存中)
  let templetData = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  templetData = handleHrard(templetData, config.headList)
  const dom = bodyHandle(templetData, config)
  // 处理style
  handleStyle(dom)
  // 处理script
  handleScript(dom)
  
}

// 开始打包
pack()

// 判断是否开启文件变动自动重新打包
if (config.autoPack) {
  // 文件变动检测
  const watcher = chokidar.watch(path.join(runPath, config.watcherFolder), {
    ignored: config.outFolder + '/*',
    persistent: true,
    usePolling: true
  })

  watcher.on('change', changePath => {
    console.log(`file change: ${changePath}`)
    // 重新打包
    pack()
  })
}

// 判断是否启用静态文件服务
if (config.server) {
  app.use(express.static(path.join(runPath, config.outFolder)))
}


// 处理websocket消息
app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(ws);
  })
})

app.listen(8000)
