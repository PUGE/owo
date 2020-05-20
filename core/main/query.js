// 快速选择器
owo.query = function (str) {
  return document.querySelectorAll('.page[template=' + owo.activePage +'] ' + str)
}
_owo.addHTMLElementFun = function (name, func) {
  if (window.HTMLElement) {
    HTMLElement.prototype[name] = func
  } else {
    for (var ind=0; ind < document.all.length; ind++) {
      document.all[ind][name] = func
    }
  }
}
_owo.addHTMLElementFun('query', function(str) {
  return this.querySelector(str)
})