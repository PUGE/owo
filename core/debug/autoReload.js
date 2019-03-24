
(function () {
  // 这是用于代码调试的自动刷新代码，他不应该出现在正式上线版本!
  if ("WebSocket" in window) {
    // 打开一个 web socket
    var ws = new WebSocket("ws://" + window.location.host)
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