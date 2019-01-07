'use strict'
const fs = require('fs')
const heardHandle = require('./lib/heard')
const bodyHandle = require('./lib/body')

const path = './src/'
const headPath = path + 'head/'
const bodyPath = path + 'body/'
const outPutPath = path + 'dist/'
const corePath = './core/'

const config = {
  entry: 'hellow'
}

// 读取模板文件
// 将整个文件一次性读取到内存中
let templet = fs.readFileSync(`${path}index.html`, 'utf8')

templet = heardHandle(headPath, templet)

const dom = bodyHandle(bodyPath, templet)

// 读取出核心代码
const configData = `
  window.PG = {
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
