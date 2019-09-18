
owo.tool.broadcast = function (key, value) {
  // 更改对应的data
  function sendMessage (obj) {
    for (const ind in obj) {
      if (obj.hasOwnProperty(ind)) {
        const element = obj[ind]
        // 查找是否有对应的方法
        if (element._receive && element._receive[key]) {
          element._receive[key](value)
        }
        if (element.template) sendMessage(element.template)
      }
    }
  }
  sendMessage(owo.script)
  
}
