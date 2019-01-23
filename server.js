let http = require('http')
const fs = require('fs')
const path = require('path')
let querystring = require('querystring')
const bodyHandle = require('./lib/page')

const corePath = path.join(__dirname, 'core')
http.createServer(function (req, res) {
  //暂存请求体信息
  let body = ""

  //请求链接
  // console.log(req.url);

  //每当接收到请求体数据，累加到post中
  req.on('data', function (chunk) {
    body += chunk;  //一定要使用+=，如果body=chunk，因为请求favicon.ico，body会等于{}
    // console.log("chunk:",chunk)
  })

  //在end事件触发后，通过querystring.parse将post解析为真正的POST请求格式，然后向客户端返回。
  req.on('end', function () {
    console.log(body)
    // 处理body
    const dom = bodyHandle(body, {
      "root": "/src",
      "entry": "servertemple0",
      "headFolder": "head",
      "outFolder": "dist",
      "autoPack": true,
      "minifyCss": false,
      "minifyJs": false,
      "pageFolder": "page"
    })

    // 根据不同情况使用不同的core
    // 读取出核心代码
    let coreScript = fs.readFileSync(path.join(corePath, 'main.js'), 'utf8')
    if (dom.isOnePage) {
      // 单页面
      coreScript += fs.readFileSync(path.join(corePath, 'SinglePage.js'), 'utf8')
    } else {
      // 多页面
      coreScript += fs.readFileSync(path.join(corePath, 'MultiPage.js'), 'utf8')
    }
    // 页面切换特效
    coreScript += fs.readFileSync(path.join(corePath, 'animation.js'), 'utf8')
    // 整合页面代码
    dom.script = coreScript + dom.script
    // 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.write(JSON.stringify(dom))
    // console.log(dom)
    res.end()
  })
}).listen(3000)