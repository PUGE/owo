
_owo.getarg = function (url) { // 获取URL #后面内容
  if (!url) return null
  var arg = url.split("#");
  return arg[1] ? arg[1].split('?')[0] : null
}

// 页面资源加载完毕事件
_owo.showPage = function() {
  for (const key in owo.script) {
    owo.script[key].$el = document.querySelector('.owo[template="' + key + '"]')
    owo.script[key] = new Page(owo.script[key])
  }
  owo.entry = document.querySelector('[template]').getAttribute('template')
  // 取出URL地址判断当前所在页面
  var pageArg = _owo.getarg(window.location.hash)
  /* if="this.config.startAtHome"
  if (pageArg !== null) {
    window.location.href = ''
    return
  }
  end */
  /* if="this.config.phoneEnter"
  // 手机进入特制页
  if (_owo.isMobi) {owo.entry = owo.phoneEnter}
  end */

  // 计算$dom
  for(var page in owo.script) {
    var idList = document.querySelectorAll('.owo[template="' + page + '"] [id]')
    owo.script[page].$dom = {}
    for (var ind = 0; ind < idList.length; ind++) {
      owo.script[page].$dom[idList[ind].getAttribute('id')] = idList[ind]
    }
  }

  // 从配置项中取出程序入口
  var page = pageArg ? pageArg : owo.entry
  if (page) {
    if (!owo.script[page].$el) {
      console.error('入口文件设置错误,错误值为: ', page)
      page = owo.script[page].$el.getAttribute('template')
      window.location.replace('#' + page)
      return
    }
    // 显示主页面
    owo.script[page].$el.style.display = 'block'
    window.owo.activePage = page
    owo.script[page].init()
    owo.script[page].handleEvent()
    // 处理插件
    var plugList = document.querySelectorAll('.owo-block')
    for (var ind = 0; ind < plugList.length; ind++) {
      var plugEL = plugList[ind]
      var plugName = plugEL.getAttribute('template')
      owo.script[plugName].$el = plugEL
      owo.script[plugName].init()
      owo.script[plugName].handleEvent()
    }
    
  } else {
    console.error('未设置程序入口!')
  }
  /* if="this.config.pageList.find(function(element) {return element.isPlug;})"
  for (var key in owo.script) {
    if (owo.script[key].type == 'block') {
      owo.script[key].$el = document.querySelector('.owo-block[template="' + key + '"]')
      _owo.runCreated(owo.script[key])
    }
  }
  end */
  // 设置当前页面为活跃页面
  owo.state.newUrlParam = _owo.getarg(document.URL)
}

/*
  页面跳转方法
  参数1: 需要跳转到页面名字
  参数2: 离开页面动画
  参数3: 进入页面动画
*/
owo.go = function (pageName, inAnimation, outAnimation, backInAnimation, backOutAnimation, noBack, param) {
  if (!owo.script[pageName]) {
    console.error("导航到不存在的页面: " + pageName)
    return
  }
  owo.script[pageName]._animation = {
    "in": inAnimation,
    "out": outAnimation,
    "forward": true
  }
  var paramString = ''
  if (param && typeof param == 'object') {
    paramString += '?'
    // 生成URL参数
    for (var paramKey in param) {
      paramString += paramKey + '=' + param[paramKey] + '&'
    }
    // 去掉尾端的&
    paramString = paramString.slice(0, -1)
  }
  // 如果有返回动画那么设置返回动画
  if (backInAnimation && backOutAnimation) {
    owo.script[owo.activePage]._animation = {
      "in": backInAnimation,
      "out": backOutAnimation,
      "forward": false
    }
  }
  if (noBack) {
    location.replace(paramString + "#" + pageName)
  } else {
    window.location.href = paramString + "#" + pageName
  }
}

// url发生改变事件
_owo.hashchange = function (e) {
  // 这样处理而不是直接用event中的URL，是因为需要兼容IE
  owo.state.oldUrlParam = owo.state.newUrlParam;
  owo.state.newUrlParam = _owo.getarg(document.URL); 
  // console.log(owo.state.oldUrlParam, owo.state.newUrlParam)
  // 如果旧页面不存在则为默认页面
  if (!owo.state.oldUrlParam) owo.state.oldUrlParam = owo.entry;
  var newUrlParam = owo.state.newUrlParam;

  // 如果没有跳转到任何页面则跳转到主页
  if (newUrlParam === undefined) {
    newUrlParam = owo.entry;
  }

  // 如果没有发生页面跳转则不需要进行操作
  // 进行页面切换
  switchPage(owo.state.oldUrlParam, newUrlParam);
}

// ios的QQ有BUG 无法触发onhashchange事件
if(/iPhone\sOS.*QQ[^B]/.test(navigator.userAgent)) {window.onpopstate = _owo.hashchange;} else {window.onhashchange = _owo.hashchange;}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)