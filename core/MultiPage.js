
_owo.getarg = function (url) { // 获取URL #后面内容
  if (!url) return null
  var arg = url.split("#");
  return arg[1] ? arg[1].split('?')[0] : null
}

// 页面资源加载完毕事件
_owo.showPage = function() {
  for (const key in owo.script) {
    owo.script[key].$el = document.querySelector('.page[template="' + key + '"]')
    owo.script[key] = new Page(owo.script[key])
  }
  owo.entry = document.querySelector('[template]').getAttribute('template')
  // 取出URL地址判断当前所在页面
  var pageArg = _owo.getarg(window.location.hash)
  /* if="this.config.startAtHome" */
  if (pageArg !== null) {
    window.location.href = ''
    return
  }
  /* end */
  /* if="this.config.phoneEnter" */
  // 手机进入特制页
  if (_owo.isMobi) {owo.entry = owo.phoneEnter}
  /* end */

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
    owo.script[page].owoPageInit()
    owo.script[page].handleEvent()
    // 处理插件
    var plugList = document.querySelectorAll('.owo-block')
    for (var ind = 0; ind < plugList.length; ind++) {
      var plugEL = plugList[ind]
      var plugName = plugEL.getAttribute('template')
      owo.script[plugName].$el = plugEL
      owo.script[plugName].owoPageInit()
      owo.script[plugName].handleEvent()
      plugEL.style.display = ''
    }
    
  } else {
    console.error('未设置程序入口!')
  }
  /* if="this.config.pageList.find(function(element) {return element.isPlug;})" */
  for (var key in owo.script) {
    if (owo.script[key].type == 'block') {
      owo.script[key].$el = document.querySelector('.owo-block[template="' + key + '"]')
      _owo.runCreated(owo.script[key])
    }
  }
  /* end */
  // 设置当前页面为活跃页面
  owo.state.newUrlParam = _owo.getarg(document.URL)
}

// url发生改变事件
_owo.hashchange = function () {
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