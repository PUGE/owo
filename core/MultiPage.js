// 获取URL #后面内容
function getarg(url){
  const arg = url.split("#");
  return arg[1];
}

// 页面资源加载完毕事件
window.onload = function() {
  // 取出URL地址判断当前所在页面
  var pageArg = getarg(window.location.href)
  // 从配置项中取出程序入口
  var page = pageArg ? pageArg.split('&')[0] : ozzx.entry
  if (page) {
    var entryDom = document.getElementById('ox-' + page)
    if (entryDom) {
      // 显示主页面
      entryDom.style.display = 'block'
      window.ozzx.activePage = page
      // 更改$data链接
      $data = ozzx.script[page].data
      runPageFunction(page, entryDom)
    } else {
      console.error('入口文件设置错误,错误值为: ', entryDom)
    }
  } else {
    console.error('未设置程序入口!')
  }
}

// url发生改变事件
window.onhashchange = function(e) {
  var oldUrlParam = getarg(e.oldURL)
  var newUrlParam = getarg(e.newURL)
  
  // 如果没有跳转到任何页面则跳转到主页
  if (newUrlParam === undefined) {
    newUrlParam = ozzx.entry
  }
  // 如果没有发生页面跳转则不需要进行操作
  // 切换页面特效
  switchPage(oldUrlParam, newUrlParam)
}
