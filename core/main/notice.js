// 向各个组件发送通知，暂时不支持参数
owo.notice = function (str) {
  function check (el) {
    for (var key in el) {
      if (Object.hasOwnProperty.call(el, key)) {
        const element = el[key];
        if (element.notice && element.notice[str]) {
          element.notice[str].apply(element)
        }
        if (element.template) check(element.template)
        if (element.view) {
          for (var tempKey in element.view) {
            if (Object.hasOwnProperty.call(element.view, tempKey)) {
              check(element.view[tempKey])
            }
          }
        }
      }
    }
  }
  check(owo.script)
}