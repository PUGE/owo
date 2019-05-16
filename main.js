#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
// 文件变动检测
const chokidar = require('chokidar')

const runProcess = require('child_process')

const owo = require('./lib')

// 命令行运行目录
const runPath = process.cwd()

// 配置输出插件
const log = require('./lib/log')()

// 配置文件检测
const checkConfig = require('./lib/checkConfig')

// Web 框架
const express = require('express')
const app = express()
// 使express处理ws请求
const wsServe = require('express-ws')(app)

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

const pack = new owo(config, () => {
  if (config.autoReload) {
    log.info(`发送重新页面需要刷新命令!`)
    // 广播发送重新打包消息
    wsServe.getWss().clients.forEach(client => client.send('reload'))
  }
})

// 开始打包
pack.pack()


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
    pack.pack(changePath)
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
      const data = JSON.parse(msg)
      // 判断是否为输出日志
      if (data.type === 'log') {
        console.log(data.message)
      }
    })
  })
}


if (config.server || config.autoReload) {
  const port = config.serverPort || 8000
  app.listen(port)
  log.info(`服务器运行在: 127.0.0.1:${port}`)
}
