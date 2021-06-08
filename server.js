
import fs from 'fs'
import path from 'path'
// 配置输出插件
import log from './lib/tool/log.js'
import request from 'request'
import Storage from './lib/storage.js'


// 命令行运行目录
const runPath = process.cwd()


function Server (config, app, owo) {
  // 监听端口
  const port = config.serverPort || 8000

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
  app.get('/getControl', function (req, res) {
    // 将存储中的Set转换为正常数组
    let storage = {}
    for (const key in Storage) {
      if (Storage.hasOwnProperty(key)) {
        const element = Storage[key];
        // 判断是否为Set
        if (element.constructor === Set) {
          storage[key] = Array.from(element)
        } else {
          storage[key] = element
        }
      }
    }
    storage.fileCache = Object.keys(storage.fileCache)
    res.send({
      err: 0,
      config: JSON.parse(fs.readFileSync(path.join(runPath, 'owo.json'), 'utf8')),
      log,
      storage: storage
    })
  })
  app.post('/setControl', (req, res) => {
    const data = req.body
    // 创建文件
    data.needCreatFile.forEach(element => {
      let filePath = path.join(runPath, element.src).replace(/\\/g, '/')
      // 判断不存在才创建
      if (!fs.existsSync(filePath)) {
        console.log(`创建文件: ${filePath}`)
        // 添加监视
        Storage.watcherFile[filePath] = { name: element.name, type: 'page' }
        fs.writeFileSync(filePath, `<template lang="pug">\r\n.${element.name}\r\n  \r\n</template>\r\n<script>\r\nmodule.exports = {\r\n}\r\n</script>\r\n<style lang="less">\r\n</style>`)
      }
    })
    // 下载文件
    data.needDownloadFile.forEach(element => {
      const filePath = path.join(process.cwd(), 'owo_modules', element.file)
      // 判断不存在才创建
      if (!fs.existsSync(filePath)) {
        console.log(`下载文件: ${element.url}`)
        const startTime = Date.now()
        request(element.url, () => {
          console.log(`${element.file}下载用时: ${Date.now() - startTime}毫秒`)
        }).pipe(fs.createWriteStream(filePath))
      } else {
        console.log(`忽略下载已存在文件: ${element.file}`)
      }
    })
    fs.writeFile(path.join(runPath, 'owo.json'), JSON.stringify(data.config, null, '\t'), () => {
      // 重新加载配置
      res.send(JSON.stringify({err: 0, config: data.config, log}))
    })
  })
  app.post('/init', (req, res) => {
    const data = req.body
    console.log(data)
    for (var index = 0; index < data.length; index++) {
      const element = data[index];
      // var filePath = path.join(runPath, element.src).replace(/\\/g, '/')
      var filePath = path.join('C:/Users/mail/Desktop/test', element.path).replace(/\\/g, '/')
      console.log(filePath)
    }
    // 循环遍历目录结构
    
    res.send(JSON.stringify({err: 0}))
  })
}

export default Server
