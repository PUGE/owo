
_owo.getarg = function (url) { // 获取URL #后面内容
  if (!url) return null
  var arg = url.split("#");
  return arg[1] ? arg[1].split('?')[0] : null
}

// 页面资源加载完毕事件
_owo.showPage = function() {
  var _index = 0
  for (var key in owo.script) {
    owo.script[key].$el = document.querySelector('.page[template="' + key + '"]')
    owo.script[key] = new Page(owo.script[key])
    owo.script[key]._index = _index++
  }
  owo.entry = document.querySelector('[template]').getAttribute('template')
  // 取出URL地址判断当前所在页面
  var pageArg = _owo.getarg(window.location.hash)
  /* if="this.config.startAtHome" */
  if (pageArg !== null) {
    window.location.href = ''
    return
  }
  /* end="this.config.startAtHome" */
  /* if="this.config.phoneEnter" */
  // 手机进入特制页
  if (_owo.isMobi) {owo.entry = owo.phoneEnter}
  /* end="this.config.phoneEnter" */

  // 从配置项中取出程序入口
  var page = pageArg ? pageArg : owo.entry
  if (page) {
    if (!owo.script[page] || !owo.script[page].$el) {
      console.error('入口文件设置错误,错误值为: ', page)
      page = owo.script[page].$el.getAttribute('template')
      window.location.replace('#' + page)
      return
    }
    // 显示主页面
    owo.script[page].$el.style.display = ''
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

// 切换页面前的准备工作
function switchPage (oldUrlParam, newUrlParam) {
  
  var oldPage = oldUrlParam ? oldUrlParam.split('&')[0] : owo.entry
  var newPage = newUrlParam ? newUrlParam.split('&')[0] : owo.entry
  // 查找页面跳转前的page页(dom节点)
  var oldDom = document.querySelector('.page[template="' + oldPage + '"]')
  var newDom = document.querySelector('.page[template="' + newPage + '"]')
  
  if (!newDom) {console.error('页面不存在!'); return}

  setTimeout(function () {
    window.owo.activePage = newPage
    window.owo.script[newPage].$el = newDom
    window.owo.script[newPage].owoPageInit()
    window.owo.script[newPage].handleEvent()
    
    // 显示路由
    if (window.owo.script[newPage].view) window.owo.script[newPage].view._list[0].showIndex(0)
  }, 0)

  /* if="Storage.pageAnimationList.size > 0" */
  // 判断是否有动画效果
  if (!owo.state._animation) owo.state._animation = {}
  // 直接.in会在ie下报错
  var animationIn = owo.state._animation['in']
  var animationOut = owo.state._animation['out']
  var forward = owo.state._animation['forward']
  // 待优化 不需要这段代码的情况不打包这段代码
  var isForward = window.owo.script[newPage]._index > window.owo.script[oldPage]._index
  if (!animationIn && !animationOut) {
    if (owo.globalAni) {
      if (owo.globalAni["in"]) animationIn =  isForward ? owo.globalAni["in"] : owo.globalAni.backIn
      if (owo.globalAni.out) animationOut = isForward ? owo.globalAni.out : owo.globalAni.backOut
    }
    if (owo.pageAni && owo.pageAni[owo.activePage]) {
      if (owo.pageAni[owo.activePage]["in"]) animationIn = isForward ? owo.pageAni[owo.activePage]["in"] : owo.pageAni[owo.activePage].backIn
      if (owo.pageAni[owo.activePage].out) animationOut = isForward ? owo.pageAni[owo.activePage].out : owo.pageAni[owo.activePage].backOut
    }
  }
  // 全局跳转设置判断
  if (owo.state.go) {
    animationIn = animationIn || owo.state.go.inAnimation
    animationOut = animationOut || owo.state.go.outAnimation
    forward = forward || owo.state.go.forward
  }
  
  if (animationIn || animationOut) {
    _owo.animation(oldDom, newDom, animationIn.split('&&'), animationOut.split('&&'), forward)
    return
  }
  /* end="Storage.pageAnimationList.size > 0" */
  
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
  }
  // 查找页面跳转后的page
  newDom.style.display = ''
}

// ios的QQ有BUG 无法触发onhashchange事件
if(/iPhone\sOS.*QQ[^B]/.test(navigator.userAgent)) {window.onpopstate = _owo.hashchange;} else {window.onhashchange = _owo.hashchange;}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)