let http = require('http')
let querystring = require('querystring')
const bodyHandle = require('./lib/page')
 
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
    
    // 处理body
    const dom = bodyHandle(body, {
      "root": "/src",
      "entry": "home",
      "headFolder": "head",
      "outFolder": "dist",
      "autoPack": true,
      "minifyCss": false,
      "minifyJs": false,
      "pageFolder": "page"
    })
    res.write(JSON.stringify(dom))
    console.log(dom)
    res.end()
  })
}).listen(3000)