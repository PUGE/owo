// 页面资源加载完毕事件
_owo.ready = function() {
  var page = owo.entry
  window.owo.activePage = page
  var entryDom = document.getElementById('o-' + page)
  if (entryDom) {
    _owo.handlePage(window.owo.script[page], entryDom)
    _owo.handleEvent(entryDom, null , entryDom)
  } else {
    console.error('找不到页面入口! 设置的入口为: ' + page)
  }
  // 设置状态为dom准备完毕
  window.owo.state.isRrady = true
}
