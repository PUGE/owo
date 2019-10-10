
// 事件推送方法
owo.tool.emit = function (eventName) {
  let argumentsList = []
  for (let ind = 1; ind < arguments.length; ind++) {
    argumentsList.push(arguments[ind])
  }
  for (const key in owo.script) {
    if (owo.script.hasOwnProperty(key)) {
      const page = owo.script[key];
      if (page.broadcast && page.broadcast[eventName]) {
        page.broadcast[eventName].apply(page, argumentsList)
      }
      // 判断是否有组件
      if (page.template) {
        for (const key in page.template) {
          if (page.template.hasOwnProperty(key)) {
            const template = page.template[key];
            if (template.broadcast && template.broadcast[eventName]) {
              template.broadcast[eventName].apply(template, argumentsList)
            }
          }
        }
      }
    }
  }
}