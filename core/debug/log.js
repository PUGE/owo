(function () {
  console.log('owo-远程调试已开启!')
  // 这是用于远程调试的代码，他不应该出现在正式上线版本!
  if ("WebSocket" in window) {
    // 打开一个 web socket
    if (!window._owo.ws) window._owo.ws = new WebSocket("ws://" + window.location.host)
    window.log = function (message) {
      console.info(message)
      window._owo.ws.send(JSON.stringify({
        type: "log",
        message
      }))
    }
    window.onerror = function(message, source, lineno, colno, error) {
      window._owo.ws.send(JSON.stringify({
        type: "log",
        message: arguments[1] + ' 第 ' + arguments[2] + ' 行 ' + arguments[3] + ' 列 发生错误: ' + arguments[0] + ' 调用堆栈: ' + arguments[4]
      }))
    }
  } else {
    console.error('浏览器不支持WebSocket')
  }
})()