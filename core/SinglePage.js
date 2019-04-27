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
  // 设置状态为dom准备完毕
  window.owo.state.isRrady = true
  // 判断是否有需要运行的其他方法
  if (window.owo.state.created != undefined) {
    window.owo.state.created.forEach(element => {
      // 运行对应的方法
      element()
    })
  }
}
