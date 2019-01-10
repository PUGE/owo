'use strict'
const fs = require('fs')
// 文件变动检测
const chokidar = require('chokidar')
// css压缩
const minifier = require('sqwish')
// js压缩
const UglifyJS = require("uglify-js")

const heardHandle = require('./lib/heard')
const bodyHandle = require('./lib/page')

const path = './src/'
const headPath = path + 'head/'
const outPutPath = path + 'dist/'
const corePath = './core/'

const config = {
  entry: 'home'
}

const packConfig = {
  // 文件改变自动重新打包
  autoPack: true,
  // 压缩css
  minifyCss: true,
  // 是否压缩js
  minifyJs: true,
  // 页面存放目录
  pagePath: path + 'page/',

}

function pack() {
  // 读取入口模板文件(一次性读取到内存中)
  let templet = fs.readFileSync(`${path}index.html`, 'utf8')
  // 使用heard处理文件
  templet = heardHandle(headPath, templet)

  const dom = bodyHandle(templet, packConfig)

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

  // 判断是否需要压缩css
  let outPutCss = coreStyle + dom.style
  if (packConfig.minifyCss) {
    outPutCss = minifier.minify(outPutCss)
  }

  // 判断是否需要压缩js
  let outPutJs = coreData + dom.script
  if (packConfig.minifyJs) {
    outPutJs = UglifyJS.minify(outPutJs).code
  }
  fs.writeFileSync(`${outPutPath}main.css`, outPutCss)
  fs.writeFileSync(`${outPutPath}main.js`, outPutJs)
  console.log('Package success!')
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

