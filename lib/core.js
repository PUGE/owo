// 获取URL #后面内容
function getarg(url){
  arg = url.split("#");
  return arg[1];
}

// 页面资源加载完毕事件
window.onload = function(e) {
  // 从配置项中取出程序入口
  var entry = globalConfig.entry
  if (entry) {
    var entryDom = document.getElementById('page-id-' + entry)
    if (entryDom) {
      // 显示主页面
      entryDom.style.display = 'block'
    } else {
      console.error('入口文件设置错误!')
    }
  } else {
    console.error('未设置程序入口!')
  }
}

// url发生改变事件
window.onhashchange = function(e) {
  var oldUrlParam = getarg(e.oldURL)
  var newUrlParam = getarg(e.newURL)
  // 查找页面跳转前的page页(dom节点)
  var oldDom = document.getElementById('page-id-' + oldUrlParam)
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
  }
  // 查找页面跳转后的page
  
  var newDom = document.getElementById('page-id-' + newUrlParam)
  console.log(newDom)
  if (newDom) {
    // 隐藏掉旧的节点
    newDom.style.display = 'block'
  } else {
    console.error('页面不存在!')
  }
}