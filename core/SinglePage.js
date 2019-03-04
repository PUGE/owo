// 页面资源加载完毕事件
window.onload = function() {
  var page = ozzx.entry
  window.ozzx.activePage = page
  // 更改$data链接
  $data = ozzx.script[page].data
  var entryDom = document.getElementById('ox-' + page)
  if (entryDom) {
    runPageFunction(page, entryDom)
  } else {
    console.error('找不到页面入口!')
  }
}