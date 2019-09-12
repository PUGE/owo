
// 事件推送方法
owo.tool.emit = function (eventName) {
  var event = owo.state.event[eventName]
  let argumentsList = []
  for (let ind = 1; ind < arguments.length; ind++) {
    argumentsList.push(arguments[ind])
  }
  event.forEach(element => {
    // 注入运行环境运行
    element.fun.apply(element.script, argumentsList)
  })
}