// 获取URL #后面内容
function getarg(url){
  const arg = url.split("#");
  return arg[1];
}

// 页面资源加载完毕事件
_owo.ready = function() {
  // 取出URL地址判断当前所在页面
  var pageArg = getarg(window.location.hash)
  // 从配置项中取出程序入口
  var page = pageArg ? pageArg.split('?')[0] : owo.entry
  if (page) {
    var entryDom = document.getElementById('o-' + page)
    if (entryDom) {
      // 显示主页面
      entryDom.style.display = 'block'
      window.owo.activePage = page
      // 更改$data链接
      $data = owo.script[page].data
      _owo.handlePage(page, entryDom)
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
  // 如果旧页面不存在则为默认页面
  if (!oldUrlParam) oldUrlParam = owo.entry
  var newUrlParam = getarg(e.newURL)
  
  // 如果没有跳转到任何页面则跳转到主页
  if (newUrlParam === undefined) {
    newUrlParam = owo.entry
  }
  // 如果没有发生页面跳转则不需要进行操作
  // 切换页面特效
  switchPage(oldUrlParam, newUrlParam)
}
