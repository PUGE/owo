
  window.CQO = {
    script: {}
  };
  var globalConfig = {"entry":"hellow"};
// 获取URL #后面内容
function getarg(url){
  arg = url.split("#");
  return arg[1];
}

// 页面资源加载完毕事件
window.onload = function(e) {
  // 取出URL地址判断当前所在页面
  var pageArg = getarg(window.location.href)
  // 从配置项中取出程序入口
  var page = pageArg ? pageArg : globalConfig.entry
  if (page) {
    var entryDom = document.getElementById('page-id-' + page)
    if (entryDom) {
      // 显示主页面
      entryDom.style.display = 'block'
      runPageFunction(page)
    } else {
      console.error('入口文件设置错误!')
    }
  } else {
    console.error('未设置程序入口!')
  }
}

// 运行页面所属的方法
function runPageFunction (pageName) {
  // 判断页面是否有自己的方法
  var newPageFunction = window.CQO.script[pageName]
  // 如果有方法,则运行它
  if (newPageFunction) {
    newPageFunction()
  }
}

// url发生改变事件
window.onhashchange = function(e) {
  var oldUrlParam = getarg(e.oldURL)
  var newUrlParam = getarg(e.newURL)
  // 查找页面跳转前的page页(dom节点)
  // console.log(oldUrlParam)
  // 如果源地址获取不到 那么一般是因为源页面为首页
  if (oldUrlParam === undefined) {
    oldUrlParam = globalConfig.entry
  }
  var oldDom = document.getElementById('page-id-' + oldUrlParam)
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
  }
  // 查找页面跳转后的page
  
  var newDom = document.getElementById('page-id-' + newUrlParam)
  // console.log(newDom)
  if (newDom) {
    // 隐藏掉旧的节点
    newDom.style.display = 'block'
  } else {
    console.error('页面不存在!')
  }
  runPageFunction(newUrlParam)
}
          window.CQO.script.hellow= function () {
            
  console.log('hellow word!')

          }
        