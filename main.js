#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
const Tool = require('./lib/tool/tool')
// 文件变动检测
const chokidar = require('chokidar')


// 命令行运行目录
const runPath = process.cwd()

// 判断运行目录下是否包含配置文件
if (!fs.existsSync(path.join(runPath, 'owo.js'))) {
  console.error('当前目录下找不到owo配置文件哦!')
  return
}

// 配置文件检测
const checkConfig = require('./lib/tool/checkConfig')

function getConfig () {
  // 读取配置文件
  let configTemp = eval(fs.readFileSync(path.join(runPath, 'owo.js'), 'utf8'))

  // 判断使用哪套配置文件
  const processArgv = process.argv[2]

  // 判断是否处于生成模式
  if (processArgv) {
    if (configTemp[processArgv]) {
      // 深拷贝
      const processConfig = JSON.parse(JSON.stringify(configTemp[processArgv]))
      configTemp = Object.assign(processConfig, configTemp)
    } else {
      log.error(`config name ${processArgv} not found in owo.js!`)
      return
    }
  }

  // 检查配置信息
  if (!checkConfig(configTemp)) {
    console.error('配置信息检查失败!')
    return
  }
  return configTemp
}

let config = getConfig()

// 加载框架SDK
const owo = require('./lib')

// 配置输出插件
const log = require('./lib/tool/log')()


// 使express处理ws请求
let wsServe = null

// 记录开始打包时间
let startPackTime = new Date().getTime()
// 添加解决方案
if (config.scheme && config.scheme.length > 0) {
  // 创建解决方案目录
  Tool.creatDirIfNotExist(path.join(process.cwd(), 'owo_scheme'))
  log.debug(`方案列表: ${config.scheme}`)
  config.scheme.forEach(element => {
    log.debug(`添加解决方案: ${element.name}`)
    const code = Tool.loadFile(path.join(__dirname, `./scheme/${element.name}/index.js`))
    if (code) {
      config = eval(code).init(config, element)
    } else {
      console.error(`方案: ./scheme/${element.name}/index.js 加载失败!`)
    }
  })
}

const pack = new owo(config, (evnet) => {
  
  if (evnet.type === 'end') {
    // 编译成功输出文字
    console.log(`Compile successfully, Use time: ${new Date().getTime() - startPackTime} msec!`)
    if (config.autoReload && wsServe) {
      log.info(`发送页面需要刷新命令!`)
      // 广播发送重新打包消息
      setTimeout(() => {
        wsServe.getWss().clients.forEach(client => client.send('reload'))
      }, 0)
    }
  }
})

// 开始打包
pack.pack()


// 判断是否开启文件变动自动重新打包
if (config.watcher && config.watcher.enable) {
  const watcherFolder = path.join(runPath, config.root)
  // 文件变动检测
  const watcher = chokidar.watch(watcherFolder, {
    // 忽略目录
    ignored: config.watcher.ignored ? config.watcher.ignored : config.outFolder + '/*',
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    },
    // 检测深度
    depth: config.watcher.depth
  })
  // 添加默认监控
  watcher.add('owo.js')
  watcher.add('owo_modules')
  watcher.on('change', changePath => {
    startPackTime = new Date().getTime()
    log.info(`file change: ${changePath}`)
    // 判断是否为配置文件变更
    if (changePath === 'owo.js') {
      pack.setConfig(getConfig())
    }
    // 重新打包
    pack.pack(changePath)
  })
}
// 判断是否启用静态文件服务
if (config.server) {
  // 监听端口
  const port = config.serverPort || 8000
  // Web 框架
  const express = require('express')
  const app = express()
  
  app.use(express.static(path.join(runPath, config.outFolder)))
  wsServe = require('express-ws')(app)
  
  app.listen(port)
  if (config.server) {
    console.log(`Server running at port: ${port} !`)
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
}

