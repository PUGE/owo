// 事件监听处理
_owo.registerEvent = function (pageFunction) {
  // 判断是否包含事件监听
  if (pageFunction.event) {
    if (!window.owo.state.event) window.owo.state.event = {}
    for (const iterator in pageFunction.event) {
      if (!window.owo.state.event[iterator]) window.owo.state.event[iterator] = []
      window.owo.state.event[iterator].push({
        pageName: window.owo.activePage,
        fun: pageFunction.event[iterator],
        script: pageFunction
      })
    }
  }
}

/* 运行页面所属的方法 */
_owo.handlePage = function (newPageFunction, entryDom) {
  /* 判断页面是否有自己的方法 */
  if (!newPageFunction) return
  newPageFunction['$el'] = entryDom
  // 快速选择器
  newPageFunction['query'] = function (str) {
    return this.$el.querySelectorAll(str)
  }
  
  _owo.runCreated(newPageFunction)

  // 注册事件监听
  _owo.registerEvent(newPageFunction)
  // 判断页面是否有下属模板,如果有运行所有模板的初始化方法
  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key]
    // 待修复,临时获取方式,这种方式获取到的dom不准确
    var childDom = entryDom.querySelectorAll('[template="' + key +'"]')[0]
    // 递归处理
    _owo.handlePage(templateScript, childDom)
  }
}

// 事件推送方法
owo.emit = function (eventName) {
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