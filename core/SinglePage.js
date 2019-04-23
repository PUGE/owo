// 页面资源加载完毕事件
_owo.ready = function() {
  var page = owo.entry
  window.owo.activePage = page
  // 更改$data链接
  $data = owo.script[page].data
  var entryDom = document.getElementById('o-' + page)
  if (entryDom) {
    _owo.handlePage(page, entryDom)
  } else {
    console.error('找不到页面入口! 设置的入口为: ' + page)
  }
}
