// 页面资源加载完毕事件
window.onload = function() {
  var page = globalConfig.entry
  window.ozzx.activePage = page
  var entryDom = document.getElementById('ox-' + page)
  if (entryDom) {
    runPageFunction(page, entryDom)
  } else {
    console.error('找不到页面入口!')
  }
}