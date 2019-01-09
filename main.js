'use strict'
const fs = require('fs')
// 文件变动检测
const chokidar = require('chokidar')

const heardHandle = require('./lib/heard')
const bodyHandle = require('./lib/page')

const path = './src/'
const headPath = path + 'head/'
const pagePath = path + 'page/'
const outPutPath = path + 'dist/'
const corePath = './core/'

const config = {
  entry: 'home',
  autoPack: true
}

function pack() {
  // 读取入口模板文件(一次性读取到内存中)
  let templet = fs.readFileSync(`${path}index.html`, 'utf8')
  // 使用heard处理文件
  templet = heardHandle(headPath, templet)

  const dom = bodyHandle(pagePath, templet)

  // 读取出核心代码
  const configData = `
    window.ozzx = {
      script: {}
    };
    var globalConfig = ${JSON.stringify(config)};
  `
  const coreData = configData + fs.readFileSync(`${corePath}main.js`, 'utf8')


  // console.log(templet)
  // 输出文件
  fs.writeFileSync(`${outPutPath}index.html`, dom.html)

  // 读取出全局样式
  const coreStyle = fs.readFileSync(`${corePath}main.css`, 'utf8') + '\r\n'

  fs.writeFileSync(`${outPutPath}main.css`, coreStyle + dom.style)
  fs.writeFileSync(`${outPutPath}main.js`, coreData + dom.script)
}

// 开始打包
pack()

// 判断是否开启文件变动自动重新打包
if (config) {
  // 文件变动检测
  const watcher = chokidar.watch(path, {
    ignored: outPutPath + '*',
    persistent: true,
    usePolling: true
  })

  watcher.on('change', path => {
    console.log(`file change: ${path}`)
    // 重新打包
    pack()
  })
}

