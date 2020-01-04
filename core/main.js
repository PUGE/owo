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
    /* if="this.htmlTemple.includes('o-innertext')"
    // 模板插值处理
    _owo.innerTextHandle(pageFunction)
    end */
  } catch (e) {
    console.error(e)
  }
}

/* if="this.htmlTemple.includes('o-innertext')"
_owo.getValFromObj = function (str, value) {
  if (!str) return undefined
  // 如果模块没有数据则直接返回null
  if (!value) value = window
  var arr = str.split('.')
  for (var index = 0; index < arr.length; index++) {
    var element = arr[index]
    if (value[element]) {
      value = value[element]
    } else {
      return undefined
    }
  }
  return value
}

// 模板插值处理
_owo.innerTextHandle = function (pageFunction) {
  var linkList = pageFunction.$el.querySelectorAll('[o-innertext]')
  for (var ind = 0; ind < linkList.length; ind++) {
    var element = linkList[ind]
    var dataFor = element.getAttribute("o-innertext")
    // 获取对应的值
    var value = _owo.getValFromObj(dataFor, pageFunction)
    // 从全局获取值!
    if (value == undefined) { value = _owo.getValFromObj(dataFor) }
    element.innerText = value
  }
}
end */


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
    (function (temp) {
      try {return eval(temp)} catch (error) {return undefined}
    }).apply(newPageFunction, [eventFor])
  }
}

_owo.bindEvent = function (eventName, eventFor, tempDom, moudleScript) {
  tempDom['on' + eventName] = function(event) {
    _owo._run(eventFor, event || this, moudleScript)
  }
}

/* owo事件处理 */
// 参数1: 当前正在处理的dom节点
// 参数2: 当前正在处理的模块名称
_owo.handleEvent = function (moudleScript) {
  console.log(moudleScript)
  if (!moudleScript.$el) throw 'error'
  var tempDom = moudleScript.$el
  // 递归处理元素属性
  function recursion(tempDom) {
    if (tempDom.attributes) {
      for (var ind = 0; ind < tempDom.attributes.length; ind++) {
        var attribute = tempDom.attributes[ind]
        // ie不支持startsWith
        var eventFor = attribute.textContent || attribute.value
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
            case 'show': {
              var eventFor = attribute.textContent || attribute.value
              // 初步先简单处理吧
              var temp = eventFor.replace(/ /g, '')
              function tempRun (temp) {
                return eval(temp)
              }
              if (tempRun.apply(moudleScript, [temp])) {
                tempDom.style.display = ''
              } else {
                tempDom.style.display = 'none'
              }
              break
            }
            case 'html': {
              var temp = eventFor.replace(/ /g, '')
              tempDom.innerHTML = (function (temp) {
                try {
                  return eval(temp)
                } catch (error) {
                  return undefined
                }
              }).apply(moudleScript, [temp])
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
      // 递归处理所有子Dom结点
      for (var i = 0; i < tempDom.children.length; i++) {
        // 获取子节点实例
        var childrenDom = tempDom.children[i]
        if (!childrenDom.hasAttribute('template')) {
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
  for (const key in moudleScript.template) {
    _owo.handleEvent(moudleScript.template[key])
  }
}

// 快速选择器
owo.query = function (str) {
  return document.querySelectorAll('.owo[template=' + owo.activePage +'] ' + str)
}

/* 运行页面所属的方法 */
_owo.handlePage = function (newPageFunction, entryDom) {
  /* 判断页面是否有自己的方法 */
  if (!newPageFunction) return
  // console.log(entryDom)
  newPageFunction['$el'] = entryDom
  // console.log(newPageFunction)
  _owo.runCreated(newPageFunction)
  // debugger
  // 判断页面是否有下属模板,如果有运行所有模板的初始化方法
  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key]
    templateScript.$el = entryDom.querySelector('[template="' + key +'"]')
  }

  owo.state.urlVariable = _owo.getQueryVariable()
  // 判断页面中是否有路由
  if (newPageFunction.view) {
    for (var viewName in newPageFunction.view) {
      var routeList = newPageFunction.view[viewName]
      // 标识是否没有指定显示哪个路由
      let activeRouteIndex = 0
      var urlViewName = owo.state.urlVariable['view-' + viewName]
      for (const routeInd in routeList) {
        const routeItem = routeList[routeInd]
        routeList[routeInd].$el = entryDom.querySelector('[view="' + viewName +'"] [route="' + routeItem._name +'"]')
        routeList[routeInd].$el.setAttribute('route-ind', routeInd)
        // console.log(urlViewName, )
        if (urlViewName && urlViewName == routeItem._name) {
          activeRouteIndex = routeInd
        }
      }
      // 激活对应路由
      _owo.showViewIndex(routeList, activeRouteIndex)
      _owo.handlePage(routeList[activeRouteIndex], routeList[activeRouteIndex].$el)
    }
  }
}

_owo.showViewIndex = function (routeList, ind) {
  for (let routeIndex = 0; routeIndex < routeList.length; routeIndex++) {
    const element = routeList[routeIndex];
    if (routeIndex == ind) {
      element.$el.style.display = 'block'
    } else {
      element.$el.style.display = 'none'
    }
  }
}

_owo.showViewName = function (routeList, name) {
  for (let routeIndex = 0; routeIndex < routeList.length; routeIndex++) {
    const element = routeList[routeIndex];
    if (element._name == name) {
      element.$el.style.display = 'block'
    } else {
      element.$el.style.display = 'none'
    }
  }
}

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