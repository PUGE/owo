#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
// 文件变动检测
const chokidar = require('chokidar')
// css压缩
const minifier = require('sqwish')
// js压缩
const UglifyJS = require("uglify-js")
// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

const heardHandle = require('./lib/heard')
const bodyHandle = require('./lib/page')

// 配置日志输出等级
logger.level = 'debug'

// 命令行运行目录
const runPath = process.cwd()

// 判断运行目录下是否包含配置文件
if (!fs.readFileSync(path.join(runPath, 'ozzx.json'))) {
  logger.error('ozzx.json file does not exist!')
  close()
}

// 读取配置文件
const config = JSON.parse(fs.readFileSync(path.join(runPath, 'ozzx.json'), 'utf8'))
// 代码目录
const demoPath = runPath + config.root
// 输出目录
const outPutPath = path.join(runPath, config.outFolder)
const corePath = path.join(__dirname, 'core')


// 执行默认打包任务
function pack () {
  // 读取入口模板文件(一次性读取到内存中)
  let templet = fs.readFileSync(path.join(demoPath, 'index.html'), 'utf8')
  // 使用heard处理文件
  templet = heardHandle(path.join(demoPath, config.headFolder), templet)

  // 处理body
  const dom = bodyHandle(templet, config)

  // 读取出全局样式
  const coreStyle = fs.readFileSync(`${demoPath}/main.css`, 'utf8') + '\r\n'

  // 判断是否需要压缩css
  let outPutCss = coreStyle + dom.style
  if (config.minifyCss) {
    outPutCss = minifier.minify(outPutCss)
  }

  // 根据不同情况使用不同的core
  let coreScript = `
    window.ozzx = {
      script: {}
    };
    var globalConfig = ${JSON.stringify(config)};
  `
  // 读取出核心代码
  coreScript += fs.readFileSync(path.join(corePath, 'main.js'), 'utf8')
  if (dom.isOnePage) {
    // 单页面
    coreScript += fs.readFileSync(path.join(corePath, 'SinglePage.js'), 'utf8')
  } else {
    // 多页面
    coreScript += fs.readFileSync(path.join(corePath, 'MultiPage.js'), 'utf8')
  }
  // 整合页面代码
  coreScript += dom.script
  // 判断是否需要压缩js
  if (config.minifyJs) {
    coreScript = UglifyJS.minify(coreScript).code
  }
  // 判断输出目录是否存在,如果不存在则创建目录
  if (!fs.existsSync(outPutPath)) {
    fs.mkdirSync(outPutPath)
  }
  // 写出文件
  fs.writeFileSync(path.join(outPutPath, 'main.css'), outPutCss)
  fs.writeFileSync(path.join(outPutPath, 'main.js'), coreScript)
  fs.writeFileSync(path.join(outPutPath, 'index.html'), dom.html)
  logger.info('Package success!')
}

// 开始打包
pack()

// 判断是否开启文件变动自动重新打包
if (config.autoPack) {
  // 文件变动检测
  const watcher = chokidar.watch(demoPath, {
    ignored: './' + config.outFolder + '/*',
    persistent: true,
    usePolling: true
  })

  watcher.on('change', changePath => {
    console.log(`file change: ${changePath}`)
    // 重新打包
    pack()
  })
}
