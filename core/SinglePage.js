// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  // 查找入口
  var entryDom = document.querySelector('[template]')
  if (entryDom) {
    owo.entry = entryDom.getAttribute('template')
    owo.activePage = owo.entry
    _owo.handlePage(window.owo.script[owo.activePage], entryDom)
    _owo.handleEvent(entryDom, null, window.owo.script[owo.activePage])
  } else {
    console.error('找不到页面入口!')
  }
}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)
