
console.log('ss')
// Mon Feb 10 2020 21:21:19 GMT+0800 (GMT+08:00)
var owo = {tool: {},state: {},};
/* 方法合集 */
var _owo = {}

/* 运行页面初始化方法 */
_owo.runCreated = function (pageFunction) {
  try {
    // console.log(pageFunction)
    if (pageFunction.show) {
      pageFunction.show.apply(pageFunction)
    }
    if (pageFunction["_isCreated"]) return

    // 确保created事件只被执行一次
    pageFunction._isCreated = true
    
    if (pageFunction.created) {
      pageFunction.created.apply(pageFunction)
    }
  } catch (e) {
    console.error(e)
  }
}


// 判断是否为手机
_owo.isMobi = navigator.userAgent.toLowerCase().match(/(ipod|ipad|iphone|android|coolpad|mmp|smartphone|midp|wap|xoom|symbian|j2me|blackberry|wince)/i) != null


_owo._run = function (eventFor, event, newPageFunction) {
  // 复制eventFor防止污染
  var eventForCopy = eventFor
  // 待优化可以单独提出来
  // 取出参数
  var parameterArr = []
  var parameterList = eventForCopy.match(/[^\(\)]+(?=\))/g)
  
  if (parameterList && parameterList.length > 0) {
    // 参数列表
    parameterArr = parameterList[0].split(',')
    // 进一步处理参数
    
    for (var i = 0; i < parameterArr.length; i++) {
      var parameterValue = parameterArr[i].replace(/(^\s*)|(\s*$)/g, "")
      // console.log(parameterValue)
      // 判断参数是否为一个字符串
      
      if (parameterValue.charAt(0) === '"' && parameterValue.charAt(parameterValue.length - 1) === '"') {
        parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1)
      }
      if (parameterValue.charAt(0) === "'" && parameterValue.charAt(parameterValue.length - 1) === "'") {
        parameterArr[i] = parameterValue.substring(1, parameterValue.length - 1)
      }
      // console.log(parameterArr[i])
    }
  }
  eventForCopy = eventFor.replace(/\([\d\D]*\)/, '')
  // console.log(newPageFunction, eventForCopy)
  // 如果有方法,则运行它
  if (newPageFunction && newPageFunction[eventForCopy]) {
    // 绑定window.owo对象
    newPageFunction.$event = event
    newPageFunction.$target = event.target
    newPageFunction[eventForCopy].apply(newPageFunction, parameterArr)
  } else {
    shaheRun.apply(newPageFunction, [eventFor])
  }
}

_owo.bindEvent = function (eventName, eventFor, tempDom, moudleScript) {
  tempDom['on' + eventName] = function(event) {
    _owo._run(eventFor, event || this, moudleScript)
  }
}

// 沙盒运行
function shaheRun (code) {
  try {
    return eval(code)
  } catch (error) {
    console.error(error)
    console.log('执行代码: ' + code)
    return undefined
  }
}


_owo._event_tap = function (tempDom, eventFor, callBack) {
  // 变量
  var startTime = 0
  var isMove = false
  tempDom.ontouchstart = function () {
    startTime = Date.now();
  }
  tempDom.ontouchmove = function () {
    isMove = true
  }
  tempDom.ontouchend = function (e) {
    if (Date.now() - startTime < 300 && !isMove) {
      callBack(e, eventFor)
    }
    // 清零
    startTime = 0;
    isMove = false
  }
}



_owo._event_if = function (tempDom, moudleScript) {
  // o-if处理
  var ifValue = tempDom.getAttribute('o-if')
  if (ifValue) {
    var temp = ifValue.replace(/ /g, '')
    var show = shaheRun.apply(moudleScript, [temp])
    if (!show) {
      tempDom.style.display = 'none'
      return false
    } else {
      tempDom.style.display = ''
    }
  }
  return true
}


/* owo事件处理 */
// 参数1: 当前正在处理的dom节点
// 参数2: 当前正在处理的模块名称
function handleEvent (moudleScript) {
  
  var moudleScript = moudleScript || this
  if (!moudleScript.$el) return
  var tempDom = moudleScript.$el
  
  if(!_owo._event_if(tempDom, moudleScript)) return
  

  
  // 判断是否有o-for需要处理
  if (moudleScript['forList']) {
    // 处理o-for
    for (var key in moudleScript['forList']) {
      var forItem = moudleScript['forList'][key];
      var forDomList = tempDom.querySelectorAll('[o-temp-for="' + forItem['for'] + '"]')
      if (forDomList.length > 0) {
        forDomList[0].outerHTML = forItem.template
        for (var domIndex = 1; domIndex < forDomList.length; domIndex++) {
          forDomList[domIndex].remove()
        }
      }
    }
  }
  
  // 递归处理元素属性
  function recursion(tempDom) {
    if (tempDom.attributes) {
      for (var ind = 0; ind < tempDom.attributes.length; ind++) {
        var attribute = tempDom.attributes[ind]
        // ie不支持startsWith
        var eventFor = attribute.textContent || attribute.value
        eventFor = eventFor.replace(/ /g, '')
        // 判断是否为owo的事件
        if (new RegExp("^o-").test(attribute.name)) {
          var eventName = attribute.name.slice(2)
          switch (eventName) {
            
            case 'tap': {
              // 待优化 可合并
              // 根据手机和PC做不同处理
              if (_owo.isMobi) {
                if (!_owo._event_tap) {console.error('找不到_event_tap方法！'); break;}
                _owo._event_tap(tempDom, eventFor, function (event, eventFor) {
                  _owo._run(eventFor, event || this, moudleScript)
                })
              } else _owo.bindEvent('click', eventFor, tempDom, moudleScript)
              break
            }
            
            
            
            
            // 处理o-value
            case 'value': {
              var value = shaheRun.apply(moudleScript, [eventFor])
              switch (tempDom.tagName) {
                case 'INPUT':
                  switch (tempDom.getAttribute('type')) {
                    case 'number':
                      if (value == undefined) value = ''
                      tempDom.value = value
                      tempDom.oninput = function (e) {
                        shaheRun.apply(moudleScript, [eventFor + '=' + e.target.value])
                      }
                      break;
                    case 'text':
                      if (value == undefined) value = ''
                      tempDom.value = value
                      tempDom.oninput = function (e) {
                        shaheRun.apply(moudleScript, [eventFor + '="' + e.target.value + '"'])
                      }
                      break;
                    case 'checkbox':
                      tempDom.checked = Boolean(value)
                      tempDom.onclick = function (e) {
                        shaheRun.apply(moudleScript, [eventFor + '=' + tempDom.checked])
                      }
                      break;
                    
                  }
                  break;
                default:
                  tempDom.innerHTML = value
                  break;
              }
              break
            }
            
            default: {
              _owo.bindEvent(eventName, eventFor, tempDom, moudleScript)
            }
          }
        } else if (attribute.name == 'view') {
          viewName = eventFor
        } else if (attribute.name == 'route') {
          routeName = eventFor
        }
      }
    }
    // 判断是否有子节点需要处理
    if (tempDom.children) {
      
      // 第一次循环是为了处理o-for
      for (var i = 0; i < tempDom.children.length; i++) {
        // 获取子节点实例
        var childrenDom = tempDom.children[i]
        // 判断是否有o-for
        var forValue = childrenDom.getAttribute('o-for')
        if (forValue) {
          
          // console.log(new Function('a', 'b', 'return a + b'))
          var forEle = shaheRun.apply(moudleScript, [forValue])
          // 如果o-for不存在则隐藏dom
          if (!forEle) {
            return
          }
          if (!moudleScript['forList']) moudleScript['forList'] = []
          
          moudleScript['forList'].push({
            "for": forValue,
            "children": forEle.length,
            "template": childrenDom.outerHTML
          })

          childrenDom.removeAttribute("o-for")
          var tempNode = childrenDom.cloneNode(true)
          var outHtml = ''
          
          for (var key in forEle) {
            tempNode.setAttribute('o-temp-for', forValue)
            var temp = tempNode.outerHTML
            var value = forEle[key];
            var tempCopy = temp
            // 获取模板插值
            var tempReg = new RegExp("(?<={).*?(?=})","g")
            while (varValue = tempReg.exec(tempCopy)) {
              // 默认变量
              var constVar = 'var value = ' + JSON.stringify(value) + '; var key = ' + key + ';\r\n '
              tempCopy = tempCopy.replace('{' + varValue + '}', shaheRun.apply(moudleScript, [constVar + varValue]))
            }
            outHtml += tempCopy
          }
          childrenDom.outerHTML = outHtml + ''
          break
        }
      }
      
      // 递归处理所有子Dom结点
      for (var i = 0; i < tempDom.children.length; i++) {
        // 获取子节点实例
        var childrenDom = tempDom.children[i]
        
        if(!_owo._event_if(childrenDom, moudleScript)) return
        
        if (!childrenDom.hasAttribute('template') && !childrenDom.hasAttribute('view')) {
          recursion(childrenDom)
        }
      }
    } else {
      console.info('元素不存在子节点!')
      console.info(tempDom)
    }
  }
  recursion(moudleScript.$el)
  // 递归处理子模板
  for (var key in moudleScript.template) {
    moudleScript.template[key].$el = tempDom.querySelector('[template=' + key + ']')
    handleEvent(moudleScript.template[key])
  }
}

// 快速选择器
owo.query = function (str) {
  return document.querySelectorAll('.owo[template=' + owo.activePage +'] ' + str)
}


// 特殊类型
function View(routeList, viewName, entryDom) {
  this._list = []
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
      element.handleEvent()
      this["_activeName"] = element._name
      this["_activeIndex"] = ind
    } else {
      element.$el.style.display = 'none'
      element.$el.removeAttribute('route-active')
    }
  }
  owo.setActiveRouteClass()
}

View.prototype.showName = function (name) {
  for (var routeIndex = 0; routeIndex < this._list.length; routeIndex++) {
    var element = this._list[routeIndex];
    if (element._name == name) {
      element.$el.style.display = 'block'
      element.$el.setAttribute('route-active', 'true')
      element.handleEvent()
      this["_activeName"] = name
      this["_activeIndex"] = element._index
    } else {
      element.$el.style.display = 'none'
      element.$el.removeAttribute('route-active')
    }
  }
  owo.setActiveRouteClass()
}


function owoPageInit () {
  // console.log(entryDom)
  // console.log(this)
  _owo.runCreated(this)
  for (var key in this.template) {
    var templateScript = this.template[key]
    _owo.runCreated(templateScript)
  }
  
  owo.state.urlVariable = _owo.getQueryVariable()
  // 判断页面中是否有路由
  if (this.view) {
    temp = []
    for (var viewName in this.view) {
      var routeList = this.view[viewName]
      this.view[viewName] = new View(routeList, viewName, this['$el'])
      // 标识是否没有指定显示哪个路由
      // 从url中获取路由信息
      var activeRouteIndex = 0
      if (viewName) {
        var urlViewName = owo.state.urlVariable['view-' + viewName]
        activeRouteIndex = this.view[viewName][urlViewName] ? this.view[viewName][urlViewName]._index : 0
      }
      // 激活对应路由
      this.view[viewName].showIndex(activeRouteIndex)
      var activeView = this.view[viewName][urlViewName] || this.view[viewName]._list[0]
      activeView.owoPageInit()
      temp.push(this.view[viewName])
    }
    this.view._list = temp
  }
  
}

function Page(pageScript) {
  for (const key in pageScript) {
    this[key] = pageScript[key]
  }
  // 处理页面引用的模板
  for (var key in pageScript.template) {
    pageScript.template[key].$el = pageScript.$el.querySelector('[template="' + key + '"]')
    pageScript.template[key] = new Page(pageScript.template[key])
  }
}

Page.prototype.owoPageInit = owoPageInit
Page.prototype.handleEvent = handleEvent

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

owo.setActiveRouteClass = function () {
  var activePageName = owo.activePage
  var activeScript = owo.script[activePageName]
  var activeViewName = activeScript.$el.querySelector('[view]').attributes['view'].value
  var activeRouteName = activeScript.view[activeViewName]._activeName
  var goList = activeScript.$el.querySelectorAll('.owo-go')
  for (let index = 0; index < goList.length; index++) {
    const element = goList[index];
    if (element.attributes["page"] && element.attributes["page"].value !== '' && element.attributes["page"].value !== activePageName) {
      element.classList.remove('active')
      continue
    }
    if (element.attributes["view"] && element.attributes["view"].value !== '' && element.attributes["view"].value !== activeViewName) {
      element.classList.remove('active')
      continue
    }
    if (element.attributes["route"] && element.attributes["route"].value !== '' && element.attributes["route"].value !== activeRouteName) {
      element.classList.remove('active')
      continue
    }
    element.classList.add('active')
  }
}



owo.go = function (config) {
  if (!config) return
  // 待优化 paramString能否不要
  var paramString = ''
  var pageString = ''
  var activePageName = config.page || owo.activePage
  var activeScript = owo.script[activePageName]
  var activeViewName = config.view || activeScript.$el.querySelector('[view]').attributes['view'].value
  if (config.page) {
    if (!owo.script[config.page]) {console.error("导航到不存在的页面: " + config.page); return}
    owo.script[config.page]._animation = {
      "in": config.inAnimation,
      "out": config.outAnimation,
      "forward": true
    }
    // 如果有返回动画那么设置返回动画
    if (backInAnimation && backOutAnimation) {
      owo.script[owo.activePage]._animation = {
        "in": config.backInAnimation,
        "out": config.backOutAnimation,
        "forward": false
      }
    }
    pageString = '#' + config.page
  }
  if (config.route) {
    paramString = '?view-' + activeViewName + '=' + config.route
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


var toList = document.querySelectorAll('.owo-go')
for (var index = 0; index < toList.length; index++) {
  var element = toList[index]
  element.onclick = function () {
    owo.go({
      page: this.attributes['page'] ? this.attributes['page'].value : null,
      view: this.attributes['view'] ? this.attributes['view'].value : null,
      route: this.attributes['route'] ? this.attributes['route'].value : null,
      replace: this.attributes['replace'] ? true : false
    })
  }
}

/*
 * 传递函数给whenReady()
 * 当文档解析完毕且为操作准备就绪时，函数作为document的方法调用
 */
_owo.ready = (function() {               //这个函数返回whenReady()函数
  var funcs = [];             //当获得事件时，要运行的函数
  
  //当文档就绪时,调用事件处理程序
  function handler(e) {
    //如果发生onreadystatechange事件，但其状态不是complete的话,那么文档尚未准备好
    if(e.type === 'onreadystatechange' && document.readyState !== 'complete') {
      return
    }
    // 确保事件处理程序只运行一次
    if(window.owo.state.isRrady) return
    window.owo.state.isRrady = true
    
    // 运行所有注册函数
    for(var i=0; i<funcs.length; i++) {
      funcs[i].call(document);
    }
    funcs = null;
  }
  //为接收到的任何事件注册处理程序
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', handler, false)
    document.addEventListener('readystatechange', handler, false)            //IE9+
    window.addEventListener('load', handler, false)
  } else if(document.attachEvent) {
    document.attachEvent('onreadystatechange', handler)
    window.attachEvent('onload', handler)
  }
  //返回whenReady()函数
  return function whenReady (fn) {
    if (window.owo.state.isRrady) {
      fn.call(document)
    } else {
      funcs.push(fn)
    }
  }
})()

// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  for (const key in owo.script) {
    if (owo.script.hasOwnProperty(key)) {
      owo.script[key].$el = document.querySelector('.owo[template="' + key + '"]')
      owo.script[key] = new Page(owo.script[key])
    }
  }
  owo.entry = document.querySelector('.owo[template]').getAttribute('template')
  // 查找入口
  if (!owo.script[owo.entry].$el) {
    console.error('找不到页面入口!')
    return
  }
  
  owo.activePage = owo.entry
  var activeScript = owo.script[owo.activePage]
  activeScript.owoPageInit()
  activeScript.handleEvent()
}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)


// 事件推送方法
owo.tool.emit = function (eventName) {
  var argumentsList = []
  for (var ind = 1; ind < arguments.length; ind++) {
    argumentsList.push(arguments[ind])
  }
  function recursion(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var page = obj[key];
        if (page.broadcast && page.broadcast[eventName]) {
          if (!page.$el) page.$el = document.querySelector('[template="' + key + '"]')
          page.broadcast[eventName].apply(page, argumentsList)
        }
        // 判断是否有组件
        if (page.template) {
          recursion(page.template)
        }
        if (page.view) {
          for (var viewKey in page.view) {
            var template = page.view[viewKey];
            recursion(template)
          }
        }
      }
    }
  }

  recursion(owo.script)
}
owo.tool.remind = function (text, time) {
  if (!text) return
  time = time || 6000
  var alertBox = document.createElement('div')
  alertBox.style.cssText = 'position: fixed;top: -40px;transition: top 1s;background-color: red;width: 100%;z-index: 9;text-align: center;line-height: 40px;color: white;font-size: 16px;'
  alertBox.innerHTML = text
  document.body.insertBefore(alertBox, document.body.lastChild)
  setTimeout(function () {
    alertBox.style.top = '0px'
  }, 0)
  setTimeout(function () {
    alertBox.style.top = '-40px'
  }, 6000)
}




// 这是用于代码调试的自动刷新代码，他不应该出现在正式上线版本!
if ("WebSocket" in window) {
  // 打开一个 web socket
  if (!window._owo.ws) window._owo.ws = new WebSocket("ws://" + window.location.host)
  window._owo.ws.onmessage = function (evt) { 
    if (evt.data == 'reload') {
      location.reload()
    }
  }
  window._owo.ws.onclose = function() { 
    console.info('与服务器断开连接')
  }
} else {
  console.error('浏览器不支持WebSocket')
}







function switchPage (oldUrlParam, newUrlParam) {
  var oldPage = oldUrlParam ? oldUrlParam.split('&')[0] : owo.entry
  var newPage = newUrlParam ? newUrlParam.split('&')[0] : owo.entry
  // 查找页面跳转前的page页(dom节点)
  var oldDom = document.querySelector('[template=' + oldPage + ']')
  var newDom = document.querySelector('.owo[template="' + newPage + '"]')
  
  if (!newDom) {
    console.error('页面不存在!')
    return
  }

  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
  }

  newDom.style.display = 'block'
  // 查找页面跳转后的page
  
  window.owo.activePage = newPage
  // 不可调换位置
  window.owo.script[newPage].$el = newDom
  window.owo.script[newPage].owoPageInit()
  window.owo.script[newPage].handleEvent()
}