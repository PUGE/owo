
const fs = require('fs')
const path = require('path')
// 配置输出插件
const log = require('./lib/tool/log')
const Tool = require('./lib/tool/tool')
const request = require('request')
const Storage = require('./lib/storage')

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
      const filePath = path.join(runPath, element.src)
      // 判断不存在才创建
      if (!fs.existsSync(filePath)) {
        console.log(`创建文件: ${filePath}`)
        fs.writeFileSync(filePath, `<template lang="pug">\r\n.${element.name}\r\n    \r\n</template>\r\n<script>\r\nmodule.exports = {\r\n}\r\n</script>\r\n<style lang="less">\r\n</style>`)
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
  app.post('/downloadFile', (req, res) => {
    const data = req.body
    const modulesPath = path.join(process.cwd(), 'owo_modules', data.file)
    if (fs.existsSync(modulesPath)) {
      res.send(JSON.stringify({err: 0}))
    } else {
      request(data.url, () => {
        res.send(JSON.stringify({err: 0}))
      }).pipe(fs.createWriteStream(modulesPath))
    }
    
  })
}
module.exports = Server