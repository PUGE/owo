
// 事件推送方法
owo.tool.emit = function (eventName) {
  var argumentsList = []
  for (var ind = 1; ind < arguments.length; ind++) {
    argumentsList.push(arguments[ind])
  }
  function recursion(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var page = obj[key];
        if (page.broadcast && page.broadcast[eventName]) {
          if (!page.$el) page.$el = document.querySelector('[template="' + key + '"]')
          page.broadcast[eventName].apply(page, argumentsList)
        }
        // 判断是否有组件
        if (page.template) {
          recursion(page.template)
        }
        if (page.view) {
          for (var viewKey in page.view) {
            var template = page.view[viewKey];
            recursion(template)
          }
        }
      }
    }
  }

  recursion(owo.script)
}