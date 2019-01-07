
  window.PG = {
    script: {}
  };
  var globalConfig = {"entry":"hellow"};
// 获取URL #后面内容
function getarg(url){
  arg = url.split("#");
  return arg[1];
}

// 页面资源加载完毕事件
window.onload = function() {
  // 取出URL地址判断当前所在页面
  var pageArg = getarg(window.location.href)
  // 从配置项中取出程序入口
  var page = pageArg ? pageArg : globalConfig.entry
  if (page) {
    var entryDom = document.getElementById('page-id-' + page)
    if (entryDom) {
      // 显示主页面
      entryDom.style.display = 'block'
      runPageFunction(page, entryDom)
    } else {
      console.error('入口文件设置错误!')
    }
  } else {
    console.error('未设置程序入口!')
  }
}

// PG-name处理
function pgNameHandler (dom) {
  // 遍历每一个DOM节点
  for (var i = 0; i < dom.children.length; i++) {
    var tempDom = dom.children[i]
    // 判断是否存在pg-name属性
    const pgName = tempDom.attributes['pg-name']
    if (pgName) {
      window.PG.domList[pgName.textContent] = tempDom
    }
    // 递归处理所有子Dom结点
    if (tempDom.children.length > 0) {
      pgNameHandler(tempDom)
    }
  }
}

// 运行页面所属的方法
function runPageFunction (pageName, entryDom) {
  // PG-name处理
  window.PG.domList = {}
  pgNameHandler(entryDom)

  // 判断页面是否有自己的方法
  var newPageFunction = window.PG.script[pageName]
  // 如果有方法,则运行它
  if (newPageFunction) {
    newPageFunction.created.apply(window.PG)
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
  runPageFunction(newUrlParam, entryDom)
}

// dom点击事件处理
function pgClick (item) {
  // 判断页面是否有自己的方法
  var newPageFunction = window.PG.script[item.name]
  // 如果有方法,则运行它
  if (newPageFunction && newPageFunction.methods[item.methodName]) {
    // 绑定window.PG对象
    newPageFunction.methods[item.methodName].apply(window.PG, [item])
  }
}
          window.PG.script.hellow = 
  {
    created: function () {
      console.log('hellow word!')
    },
    methods: {
      showAlert: function (event) {
        console.log(event)
        event.dom.innerText = "Welcome"
      }
    }
  }

        
          window.PG.script.name = 
  {
    created: function () {
      console.log('my name is pack!')
    }
  }

        