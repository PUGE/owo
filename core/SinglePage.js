// 页面资源加载完毕事件
_owo.showPage = function() {
  var page = owo.entry
  window.owo.activePage = page
  var entryDom = document.getElementById('o-' + page)
  if (entryDom) {
    _owo.handlePage(window.owo.script[page], entryDom)
    _owo.handleEvent(entryDom, null)
  } else {
    console.error('找不到页面入口! 设置的入口为: ' + page)
  }
}
