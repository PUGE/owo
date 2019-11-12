
// 事件推送方法
owo.tool.emit = function (eventName) {
  var argumentsList = []
  for (var ind = 1; ind < arguments.length; ind++) {
    argumentsList.push(arguments[ind])
  }
  for (var key in owo.script) {
    if (owo.script.hasOwnProperty(key)) {
      var page = owo.script[key];
      if (page.broadcast && page.broadcast[eventName]) {
        if (!page.$el) page.$el = document.querySelector('[template="' + key + '"]')
        page.broadcast[eventName].apply(page, argumentsList)
      }
      // 判断是否有组件
      if (page.template) {
        for (var key in page.template) {
          if (page.template.hasOwnProperty(key)) {
            var template = page.template[key];
            if (template.broadcast && template.broadcast[eventName]) {
              if (!template.$el) template.$el = document.querySelector('[template="' + key + '"]')
              template.broadcast[eventName].apply(template, argumentsList)
            }
          }
        }
      }
    }
  }
}