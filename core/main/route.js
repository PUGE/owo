
/* if="Storage.plugList.has('route')" */
// 特殊类型
function View(routeList, viewName, entryDom, pageScript) {
  this._list = []
  this._viewName = viewName
  this.$el = entryDom.querySelector('[view="' + viewName +'"]')
  for (var routeInd = 0; routeInd < routeList.length; routeInd++) {
    var routeItem = routeList[routeInd]
    this._list[routeInd] = routeItem
    this._list[routeInd]._index = routeInd
    this._list[routeInd].$el = entryDom.querySelector('[view="' + viewName +'"] [route="' + routeItem._name +'"]')
    // 默认隐藏route
    this._list[routeInd].$el.setAttribute('route-active', 'false')
    // 错误处理
    if (!this._list[routeInd].$el) {
      console.error('找不到视窗 ' + viewName + ' 中的路由: ' + routeItem._name)
      break
    }
    this._list[routeInd] = new Page(this._list[routeInd], pageScript)
    this._list[routeInd].$el.setAttribute('route-ind', routeInd)
    this[routeItem._name] = this._list[routeInd]
  }
}

owo.state.routeBusy = false

View.prototype.showIndex = function (ind) {
  if (owo.state.routeBusy) return
  owo.state.routeBusy = true
  // 防止来回快速切换页面出问题
  if (owo.state[this._viewName + '_changeing']) return
  owo.state[this._viewName + '_changeing'] = true
  this._activeIndex = this._activeIndex
  var oldRoute = this._list[this._activeIndex]
  // 如果新旧路由和旧路由是一样的那么不做处理
  if (this._activeIndex == ind) {
    oldRoute.$el.setAttribute('route-active', 'true')
    owo.state[this._viewName + '_changeing'] = false
    owo.state.routeBusy = false
    return
  }
  var newRoute = this._list[ind]
  if (!newRoute) {console.error('导航到不存在的页面: ' + ind);return;}
  this["_activeName"] = newRoute._name
  this["_activeIndex"] = ind
  newRoute.owoPageInit()
  newRoute.handleEvent()
  if (oldRoute) {
    if (owo.state._animation || owo.globalAni) {
      var animationValue = owo.state._animation || owo.globalAni
      if (newRoute._index > oldRoute._index) _owo.animation(oldRoute.$el, newRoute.$el, animationValue.in, animationValue.out)
      else _owo.animation(oldRoute.$el, newRoute.$el, animationValue.backIn, animationValue.backOut)
    } else {
      _owo.animation(oldRoute.$el, newRoute.$el)
    }
    // 加个延时隐藏不然直接隐藏动画效果不好
    setTimeout(() => {
      owo.state[this._viewName + '_changeing'] = false
      oldRoute.$el.setAttribute('route-active', 'false')
    }, 800);
  } else {
    owo.state[this._viewName + '_changeing'] = false
  }
  newRoute.$el.setAttribute('route-active', 'true')
  owo.onViewChange()
  owo.state.routeBusy = false
}

View.prototype.showName = function (name) {
  if (owo.state.routeBusy) return
  owo.state.routeBusy = true
  // 防止来回快速切换页面出问题
  if (owo.state[this._viewName + '_changeing']) return
  owo.state[this._viewName + '_changeing'] = true

  var oldRoute = this[this._activeName]
  var newRoute = this[name]
  if (!newRoute) {console.error('导航到不存在的页面: ' + name);return;}
  // 如果新旧路由和旧路由是一样的那么不做处理
  if (this._activeName == name) {
    oldRoute.$el.setAttribute('route-active', 'true')
    owo.state[this._viewName + '_changeing'] = false
    return
  }
  // 根据index
  this["_activeName"] = newRoute._name
  this["_activeIndex"] = newRoute._index
  // 如果没有旧路由，那么直接显示新路由就行
  
  newRoute.owoPageInit()
  newRoute.handleEvent()
  if (oldRoute) {
    if (owo.state._animation || owo.globalAni) {
      var animationValue = owo.state._animation || owo.globalAni
      if (newRoute._index > oldRoute._index) _owo.animation(oldRoute.$el, newRoute.$el, animationValue.in, animationValue.out)
      else _owo.animation(oldRoute.$el, newRoute.$el, animationValue.backIn, animationValue.backOut)
    } else {
      _owo.animation(oldRoute.$el, newRoute.$el)
    }
    // 加个延时隐藏不然直接隐藏动画效果不好
    setTimeout(() => {
      owo.state[this._viewName + '_changeing'] = false
      oldRoute.$el.setAttribute('route-active', 'false')
      owo.state.routeBusy = false
    }, 800);
  } else {
    owo.state[this._viewName + '_changeing'] = false
    owo.state.routeBusy = false
  }
  newRoute.$el.setAttribute('route-active', 'true')
  owo.onViewChange()
}
View.prototype.owoPageInit = owoPageInit
View.prototype.handleEvent = handleEvent

owo.onViewChange = function () {}

_owo.getViewChange = function () {
  var activeScript = owo.script[owo.activePage]
  // 路由列表
  var viewList = activeScript.$el.querySelectorAll('[view]')
  // 获取url参数
  owo.state.urlVariable = _owo.getQueryVariable()
  for (var index = 0; index < viewList.length; index++) {
    var viewItem = viewList[index];
    var viewName = viewItem.getAttribute('view')
    var viewValue = owo.state.urlVariable['view-' + viewName]
    if (viewValue) {
      activeScript.view[viewName].showName(viewValue)
    } else {
      activeScript.view[viewName].showIndex(0)
    }
  }
}

/* end="Storage.plugList.has('route')" */

/* if="Storage.plugList.has('route') || Storage.plugList.has('go') || this.config.pageList.length > 1" */
owo.go = function (aniStr) {
  if (!aniStr || typeof aniStr !== 'string')  {
    console.error('owo.go的正确使用方法为: owo.go("页面名/URL参数/入场动画/离场动画/是否允许返回/返回入场动画/返回离场动画")')
    return
  }
  var target = aniStr.split('/')
  var config = {
    page: target[0],
    paramString: target[1],
    inAnimation: target[2],
    outAnimation: target[3],
    noBack: target[4],
    backInAnimation: target[5],
    backOutAnimation: target[6],
  }
  var paramString = ''
  var pageString = '#' + owo.activePage
  var activePageName = config.page || owo.activePage
  
  // 处理动画缩写
  if (config['ani']) {
    var temp = config['ani'].split('/')
    config.inAnimation = temp[0]
    config.outAnimation = temp[1]
  }
  // 待优化 不需要这段代码的情况不打包这段代码
  if (!config.inAnimation && !config.outAnimation) {
    if (owo.globalAni) {
      if (owo.globalAni["in"]) config.inAnimation =  owo.globalAni["in"]
      if (owo.globalAni.out) config.outAnimation = owo.globalAni.out
      if (owo.globalAni["backIn"]) config.backInAnimation = owo.globalAni["backIn"]
      if (owo.globalAni["backOut"]) config.backOutAnimation = owo.globalAni["backOut"]
    }
    if (owo.pageAni && owo.pageAni[activePageName]) {
      if (owo.pageAni[activePageName]["in"]) config.inAnimation = owo.pageAni[activePageName]["in"]
      if (owo.pageAni[activePageName]["out"]) config.outAnimation = owo.pageAni[activePageName]["out"]
      if (owo.pageAni[activePageName]["backIn"]) config.backInAnimation = owo.globalAni["backIn"]
      if (owo.pageAni[activePageName]["backOut"]) config.backOutAnimation = owo.globalAni["backOut"]
    }
  }
  if (config.inAnimation && config.outAnimation) {
    owo.state._animation = {
      "in": config.inAnimation,
      "out": config.outAnimation,
      "backIn": config.backInAnimation,
      "backOut": config.backOutAnimation,
      "forward": true
    }
  }
  if (config.page) {
    if (!owo.script[config.page]) {console.error("导航到不存在的页面: " + config.page); return}
    if (config.page != owo.activePage) pageString = '#' + config.page
  }
  if (config.paramString) {
    var search = _owo.getQueryVariable()
    var addSEarch = config.paramString.split('=')
    search[addSEarch[0]] = addSEarch[1]
    paramString = '?'
    for (var key in search) {
      var value = search[key]
      if (value) paramString += (paramString == '?' ?  '' : '&') + key + '=' + value
    }
  }
  // 防止在同一个页面刷新
  if (!paramString && !pageString) return
  // owo.state._animation = null
  // 判断是否支持history模式
  if (window.history && window.history.pushState) {
    if (config.noBack) {
      window.history.replaceState({
        url: window.location.href
      }, '', paramString + pageString)
    } else {
      window.history.pushState({
        url: window.location.href
      }, '', paramString + pageString)
    }

    if (config.page) _owo.hashchange()
    if (config.paramString) _owo.getViewChange()
  } else {
    if (config.noBack) {
      location.replace(paramString + pageString)
    } else {
      window.location.href = paramString + pageString
    }
  }
}
/* end="Storage.plugList.has('route') || Storage.plugList.has('go') || this.config.pageList.length > 1" */
/* if="Storage.plugList.has('go')" */
// 待修复 跳转返回没有了
var toList = document.querySelectorAll('[go]')
for (var index = 0; index < toList.length; index++) {
  var element = toList[index]
  element.onclick = function () {
    owo.go(this.attributes['go'].value)
  }
}
/* end="Storage.plugList.has('go')" */