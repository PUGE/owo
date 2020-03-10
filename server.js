
const fs = require('fs')
const path = require('path')
// 配置输出插件
const log = require('./lib/tool/log')
const request = require('request')

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
    res.send({
      err: 0,
      config: JSON.parse(fs.readFileSync(path.join(runPath, 'owo.json'), 'utf8')),
      log,
      plugList: owo.plugList,
      animateList: Array.from(owo.animateList),
      pageAnimationList: Array.from(owo.pageAnimationList),
      resourceList: owo.resource.imageCache
    })
  })
  app.post('/setControl', (req, res) => {
    const data = req.body
    data.needCreatFile.forEach(element => {
      const filePath = path.join(runPath, element.src)
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `<template lang="pug">\r\n.box\r\n</template>\r\n<script>\r\nmodule.exports = {\r\n}\r\n</script>\r\n<style lang="less">\r\n</style>`)
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