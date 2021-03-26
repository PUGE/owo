// 向各个组件发送通知，暂时不支持参数
owo.notice = function (str) {
  function check (el) {
    for (const key in el) {
      if (Object.hasOwnProperty.call(el, key)) {
        const element = el[key];
        if (element.notice && element.notice[str]) {
          element.notice[str].apply(element)
        }
        if (element.template) check(element.template)
        // console.log(element)
      }
    }
  }
  check(owo.script)
}