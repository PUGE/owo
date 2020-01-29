// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  // 查找入口
  var entryDom = document.querySelector('[template]')
  if (!entryDom) {
    console.error('找不到页面入口!')
    return
  }
  owo.entry = entryDom.getAttribute('template')
  owo.activePage = owo.entry
  var activeScript = owo.script[owo.activePage]
  activeScript.$el = entryDom
  _owo.handlePage(activeScript)
  _owo.handleEvent(activeScript)
  // 路由列表
  var viewList = entryDom.querySelectorAll('[view]')
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
