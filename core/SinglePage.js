// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  // 查找入口
  var entryDom = document.querySelector('[template]')
  if (entryDom) {
    owo.entry = entryDom.getAttribute('template')
    owo.activePage = owo.entry
    _owo.handlePage(window.owo.script[owo.activePage], entryDom)
    _owo.handleEvent(entryDom, window.owo.script[owo.activePage])
  } else {
    console.error('找不到页面入口!')
  }
  // 路由列表
  var viewList = entryDom.querySelectorAll('[view]')
  // 获取url参数
  owo.state.urlVariable = _owo.getQueryVariable()
  for (let index = 0; index < viewList.length; index++) {
    const viewItem = viewList[index];
    var viewName = viewItem.getAttribute('view')
    var viewValue = owo.state.urlVariable['view-' + viewName]
    console.log(viewValue)
    if (viewValue) {
      _owo.showViewName(viewItem, viewValue)
    } else {
      _owo.showViewIndex(viewItem, 0)
    }
  }
}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)
