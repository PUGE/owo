
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

View.prototype.showIndex = function (ind) {
  if (this._list.length - 1 < ind) {console.error('导航到不存在的页面: ' + ind);return;}
  if (this._activeIndex) {
    this._list[this._activeIndex].$el.setAttribute('route-active', 'false')
  }
  var element = this._list[ind]
  element.$el.setAttribute('route-active', 'true')
  element.owoPageInit()
  element.handleEvent()
  this["_activeName"] = element._name
  this["_activeIndex"] = ind
  _owo.setActiveRouteClass(this)
}

View.prototype.showName = function (name) {
  var oldRoute = this[this._activeName]
  var newRoute = this[name]
  if (!newRoute) {console.error('导航到不存在的页面: ' + name);return;}
  // 根据index
  this["_activeName"] = newRoute._name
  this["_activeIndex"] = newRoute._index
  newRoute.owoPageInit()
  newRoute.handleEvent()
  newRoute.$el.setAttribute('route-active', 'true')
  oldRoute.$el.removeAttribute('route-active')
  if (owo.state._animation || owo.globalAni) {
    var animationValue = owo.state._animation || owo.globalAni
    if (newRoute._index > oldRoute._index) _owo.animation(oldRoute.$el, newRoute.$el, animationValue.in, animationValue.out)
    else _owo.animation(oldRoute.$el, newRoute.$el, animationValue.backIn, animationValue.backOut)
  } else {
    _owo.animation(oldRoute.$el, newRoute.$el)
  }
  
  _owo.setActiveRouteClass(this)
}
View.prototype.owoPageInit = owoPageInit
View.prototype.handleEvent = handleEvent

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

_owo.setActiveRouteClass = function (viewInfo) {
  var goList = owo.query('[go]')
  for (var index = 0; index < goList.length; index++) {
    var element = goList[index];
    var goValue = element.getAttribute('go').split('/')
    if (goValue[0] && goValue[0] !== owo.activePage) {
      element.classList.remove('active')
      continue
    }
    if (goValue[1] && goValue[1] !== viewInfo._viewName) {
      element.classList.remove('active')
      continue
    }
    if (goValue[2] && goValue[2] !== viewInfo._activeName) {
      element.classList.remove('active')
      continue
    }
    element.classList.add('active')
  }
  owo.activeView = viewInfo._viewName
  owo.activeRoute = viewInfo._activeName
}
/* end="Storage.plugList.has('route')" */

/* if="Storage.plugList.has('route') || Storage.plugList.has('go') || this.config.pageList.length > 1" */
owo.go = function (config) {
  if (!config) return
  var paramString = ''
  var pageString = ''
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
    }
    if (owo.pageAni && owo.pageAni[activePageName]) {
      if (owo.pageAni[activePageName]["in"]) config.inAnimation = owo.pageAni[activePageName]["in"]
      if (owo.pageAni[activePageName].out) config.outAnimation = owo.pageAni[activePageName].out
    }
  }
  if (config.inAnimation && config.outAnimation) {
    owo.state._animation = {
      "in": config.inAnimation,
      "out": config.outAnimation,
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
      // 待优化 怎么前面多了个&
      var value = search[key]
      if (value) paramString += '&' + key + '=' + value
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
    var target = this.attributes['go'].value.split('/')
    owo.go({
      page: target[0],
      paramString: target[1],
      inAnimation: target[2],
      outAnimation: target[3],
      noBack: target[4],
    })
  }
}
/* end="Storage.plugList.has('go')" */