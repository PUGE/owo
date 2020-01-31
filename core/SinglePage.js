// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  for (const key in owo.script) {
    if (owo.script.hasOwnProperty(key)) {
      owo.script[key].$el = document.querySelector('.owo[template="' + key + '"]')
      owo.script[key] = new Page(owo.script[key])
    }
  }
  owo.entry = document.querySelector('.owo[template]').getAttribute('template')
  // 查找入口
  if (!owo.script[owo.entry].$el) {
    console.error('找不到页面入口!')
    return
  }
  
  owo.activePage = owo.entry
  var activeScript = owo.script[owo.activePage]
  activeScript.init()
  activeScript.handleEvent()
  // 路由列表
  var viewList = owo.script[owo.activePage].$el.querySelectorAll('[view]')
  // 获取url参数
  owo.state.urlVariable = _owo.getQueryVariable()
  for (var index = 0; index < viewList.length; index++) {
    var viewItem = viewList[index];
    var viewName = viewItem.getAttribute('view')
    var viewValue = owo.state.urlVariable['view-' + viewName]
    if (viewValue) {
      activeScript.view[viewName].showName(viewValue)
    } else {
      activeScript.view[viewName].showIndex(0)
    }
  }
}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)
