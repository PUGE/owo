
/* if="this.plugList.includes('route')" */
// 特殊类型
function View(routeList, viewName, entryDom) {
  this._list = []
  this._viewName = viewName
  this.$el = entryDom.querySelector('[view="' + viewName +'"]')
  for (var routeInd in routeList) {
    var routeItem = routeList[routeInd]
    this._list[routeInd] = routeItem
    this._list[routeInd]._index = routeInd
    this._list[routeInd].$el = entryDom.querySelector('[view="' + viewName +'"] [route="' + routeItem._name +'"]')
    // 错误处理
    if (!this._list[routeInd].$el) {
      console.error('找不到视窗 ' + viewName + ' 中的路由: ' + routeItem._name)
      break
    }
    this._list[routeInd] = new Page(this._list[routeInd])
    this._list[routeInd].$el.setAttribute('route-ind', routeInd)
    this[routeItem._name] = this._list[routeInd]
  }
}

View.prototype.showIndex = function (ind) {
  for (var routeIndex = 0; routeIndex < this._list.length; routeIndex++) {
    var element = this._list[routeIndex];
    if (routeIndex == ind) {
      element.$el.style.display = 'block'
      element.$el.setAttribute('route-active', 'true')
      element.handleEvent(owo.script[owo.activePage], element.$el)
      this["_activeName"] = element._name
      this["_activeIndex"] = ind
    } else {
      element.$el.style.display = 'none'
      element.$el.removeAttribute('route-active')
    }
  }
  owo.setActiveRouteClass(this)
}

View.prototype.showName = function (name) {
  for (var routeIndex = 0; routeIndex < this._list.length; routeIndex++) {
    var element = this._list[routeIndex];
    if (element._name == name) {
      element.$el.style.display = 'block'
      element.$el.setAttribute('route-active', 'true')
      element.handleEvent(owo.script[owo.activePage], element.$el)
      this["_activeName"] = name
      this["_activeIndex"] = element._index
    } else {
      element.$el.style.display = 'none'
      element.$el.removeAttribute('route-active')
    }
  }
  owo.setActiveRouteClass(this)
}
View.prototype.owoPageInit = owoPageInit
View.prototype.handleEvent = handleEvent
// 获取URL中的参数
_owo.getQueryVariable = function () {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  var temp = {}
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    temp[pair[0]] = pair[1];
  }
  return temp;
}
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

owo.setActiveRouteClass = function (viewInfo) {
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
}
/* end */

/* if="this.plugList.includes('route') || this.config.pageList.length > 1" */
owo.go = function (config) {
  if (!config) return
  // 待优化 paramString能否不要
  var paramString = ''
  var pageString = ''
  var activePageName = config.page || owo.activePage
  var activeScript = owo.script[activePageName]
  
  // 处理动画缩写
  if (config['ani']) {
    const temp = config['ani'].split('/')
    config.inAnimation = temp[0]
    config.outAnimation = temp[1]
    config.backInAnimation = temp[2]
    config.backOutAnimation = temp[3]
  }
  if (config.page) {
    if (!owo.script[config.page]) {console.error("导航到不存在的页面: " + config.page); return}
    if (config.page == owo.activePage) return
    owo.script[config.page]._animation = {
      "in": config.inAnimation,
      "out": config.outAnimation,
      "forward": true
    }
    // 如果有返回动画那么设置返回动画
    if (config.backInAnimation && config.backOutAnimation) {
      owo.script[owo.activePage]._animation = {
        "in": config.backInAnimation,
        "out": config.backOutAnimation,
        "forward": false
      }
    }
    pageString = '#' + config.page
  }
  if (config.route) {
    if (activeScript.$el.querySelector('[view]')) {
      var activeViewName = config.view ? config.view : activeScript.$el.querySelector('[view]').attributes['view'].value
      paramString = '?view-' + activeViewName + '=' + config.route
    } else {
      console.error('页面中找不到路由组件!')
    }
  }
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
    if (config.route) _owo.getViewChange()
  } else {
    if (config.noBack) {
      location.replace(paramString + pageString)
    } else {
      window.location.href = paramString + pageString
    }
  }
}
/* end */
/* if="this.plugList.includes('go')" */
var toList = document.querySelectorAll('[go]')
for (var index = 0; index < toList.length; index++) {
  var element = toList[index]
  element.onclick = function () {
    var target = this.attributes['go'].value.split('/')
    owo.go({
      page: target[0],
      view: target[1],
      route: target[2],
      inAnimation: target[3],
      outAnimation: target[4],
      backInAnimation: target[5],
      backOutAnimation: target[6],
      noBack: target[7],
    })
  }
}
/* end */