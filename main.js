#!/usr/bin/env node

'use strict'
import fs from 'fs'
import path from 'path'
import Tool from './lib/tool/tool.js'
import Server from './server.js'
import Storage from './lib/storage.js'
import register from './lib/register.js'

// Web 框架
import express from 'express'
import bodyParser from 'body-parser'
import ws from 'express-ws'

// 命令行运行目录
const runPath = process.cwd()

// 判断运行目录下是否包含配置文件
if (!fs.existsSync(path.join(runPath, 'owo.json'))) {
  throw Error('当前目录下找不到owo配置文件哦!')
}
// 配置文件检测
import checkConfig from './checkConfig.js'

function getConfig () {
  // 读取配置文件
  let configTemp = JSON.parse(fs.readFileSync(path.join(runPath, 'owo.json'), 'utf8'))

  // 判断使用哪套配置文件
  const processArgv = process.argv[2]

  // 判断是否处于生成模式
  if (processArgv) {
    if (configTemp.mode && configTemp.mode[processArgv]) {
      // 深拷贝
      const processConfig = JSON.parse(JSON.stringify(configTemp.mode[processArgv]))
      if (processConfig['scriptList']) {
        processConfig['scriptList'].forEach(element => {
          configTemp['scriptList'].push(element)
        });
      }
      
      configTemp = Object.assign(processConfig, configTemp)
      
    } else {
      console.error(`config name ${processArgv} not found in owo.json!`)
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
import owo from './lib/index.js'

// 配置输出插件
import log from './lib/tool/log.js'

const __dirname = path.resolve(process.argv[1], '../')
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

const owoCallBack = (evnet) => {
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
}

let pack = null
let wsServe = null

// 判断是否开启文件变动自动重新打包
if (config.watcherEnable) {
  log.debug('开启变动检测!')
  const watcherFolder = path.join(runPath, config.root)

  // 文件变动检测
  let isPacking = false
  // 监控工程文件夹
  fs.watch(path.join(runPath, 'owo.json'), {recursive: false}, (type, fileName) => {
    if (isPacking) return
    isPacking = true
    setTimeout(() => {
      startPackTime = new Date().getTime()
      log.clear()
      Storage.clear()
      console.log('配置文件被改变!')
      pack = new owo(getConfig(), owoCallBack)
      pack.pack()
      isPacking = false
    }, 100)
  })

  function onFileChange (changePath) {
    
    // 防止一次修改多个文件造成多次刷新
    if (isPacking) return
    isPacking = true
    setTimeout(() => {
      // 忽略掉输出目录
      if (changePath.startsWith(outPutPath)) {
        isPacking = false
        return
      }
      startPackTime = new Date().getTime()
      log.info(`file change: ${changePath}`)
      // 统一路径为左斜线
      changePath = changePath.replace(/\\/g, '/')
      
      const watcherFileItem = Storage.watcherFile[changePath]
      // 如果不是监听目录 那么什么也不做
      if (!watcherFileItem) {isPacking = false; return null;}
      // 如果是owo页面文件 需要重新打包
      if (watcherFileItem.type !== 'page' && watcherFileItem.type !== 'block' && watcherFileItem.type !== 'plug' && watcherFileItem.type !== 'route') {
        register.fileChange(changePath, pack)
        log.info(`刷新模式,变化目录: ${changePath}`)
        isPacking = false
        return
      }
      // 重新打包
      pack.pack(true)
      isPacking = false
    }, 100);
  }

  const outPutPath = path.join(runPath, config.outFolder)
  fs.watch(watcherFolder, {recursive: true}, (type, fileName) => {
    onFileChange(path.join(watcherFolder, fileName))
  })
  fs.watch(path.join(runPath, "owo_modules"), {recursive: true}, (type, fileName) => {
    onFileChange(path.join(runPath, "owo_modules", fileName))
  })
}
// 判断是否启用静态文件服务
if (config.server) {
  const app = express()
  wsServe = ws(app)
  app.use(bodyParser.json())
  // 设置静态目录
  app.use(express.static(path.join(runPath, config.outFolder)))
  app.use('/control', express.static(path.join(__dirname, `./control/dist`)))
  // 开始打包
  pack = new owo(config, owoCallBack)
  // 开启服务器
  Server(config, app, pack)
} else {
  pack = new owo(config)
}
pack.pack()

