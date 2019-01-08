'use strict'
const fs = require('fs')


const heardHandle = require('./lib/heard')
const bodyHandle = require('./lib/body')

const path = './src/'
const headPath = path + 'head/'
const pagePath = path + 'page/'
const outPutPath = path + 'dist/'
const corePath = './core/'

const config = {
  entry: 'home'
}

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
