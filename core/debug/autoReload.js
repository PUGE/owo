
(function () {
  if ("WebSocket" in window) {
    // 打开一个 web socket
    var ws = new WebSocket("ws://localhost:8000")
    ws.onmessage = function (evt) { 
      if (evt.data == 'reload') {
        location.reload()
      }
    }
    ws.onclose = function() { 
      console.info('与服务器断开连接')
    }
  } else {
    console.error('浏览器不支持WebSocket')
  }
})()