function switchPage (oldUrlParam, newUrlParam) {
  var oldPage = oldUrlParam.split('&')[0]
  var newPage = newUrlParam.split('&')[0]
  // 查找页面跳转前的page页(dom节点)
  // console.log(oldUrlParam)
  // 如果源地址获取不到 那么一般是因为源页面为首页
  if (oldPage === undefined) {
    oldPage = owo.entry
  }
  var oldDom = document.getElementById('o-' + oldPage)
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
  }
  // 查找页面跳转后的page
  
  var newDom = document.getElementById('o-' + newPage)
  // console.log(newDom)
  if (newDom) {
    // 隐藏掉旧的节点
    newDom.style.display = 'block'
  } else {
    console.error('页面不存在!')
    return
  }
  window.owo.activePage = newPage
  // 更改$data链接
  $data = owo.script[newPage].data
  _owo.handlePage(newPage, newDom)
}