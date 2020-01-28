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

/* owo事件处理 */
// 参数1: 当前正在处理的dom节点
// 参数2: 当前正在处理的模块名称
_owo.handleEvent = function (moudleScript) {
  if (!moudleScript.$el) throw 'error'
  var tempDom = moudleScript.$el
  // 判断是否有o-for需要处理
  if (moudleScript['for'] && moudleScript['for'].length > 0) {
    // 处理o-for
    for (var key in moudleScript['for']) {
      var forItem = moudleScript['for'][key];
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
            /* if="this.htmlTemple.includes('o-tap')"
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
            end */
            /* if="this.htmlTemple.includes('o-show')"
            case 'show': {
              if (shaheRun.apply(moudleScript, [eventFor])) {
                tempDom.style.display = ''
              } else {
                tempDom.style.display = 'none'
              }
              break
            }
            end */
            
            /* if="this.htmlTemple.includes('o-value')"
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
            end */
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
      // /* if="this.htmlTemple.includes('o-for')"
      // 第一次循环是为了处理o-for
      for (var i = 0; i < tempDom.children.length; i++) {
        // 获取子节点实例
        var childrenDom = tempDom.children[i]
        // 判断是否有o-for
        var forValue = childrenDom.getAttribute('o-for')
        if (forValue) {
          // console.log(new Function('a', 'b', 'return a + b'))
          var forEle = shaheRun.apply(moudleScript, [forValue])
          if (!moudleScript['for']) moudleScript['for'] = []
          
          moudleScript['for'].push({
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
      // end */
      // 递归处理所有子Dom结点
      for (var i = 0; i < tempDom.children.length; i++) {
        // 获取子节点实例
        var childrenDom = tempDom.children[i]
        // o-if处理
        var ifValue = childrenDom.getAttribute('o-if')
        if (ifValue) {
          var temp = ifValue.replace(/ /g, '')
          var show = shaheRun.apply(moudleScript, [temp])
          if (!show) {
            childrenDom.style.display = 'none'
            return
          } else {
            childrenDom.style.display = ''
          }
        }
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
    _owo.handleEvent(moudleScript.template[key])
  }
}

// 快速选择器
owo.query = function (str) {
  return document.querySelectorAll('.owo[template=' + owo.activePage +'] ' + str)
}

function View (obj, entryDom) {
  for (var viewName in obj) {
    var routeList = obj[viewName]
    this[viewName] = []
    // 标识是否没有指定显示哪个路由
    var activeRouteIndex = 0
    // 从url中获取路由信息
    var urlViewName = owo.state.urlVariable['view-' + viewName]
    for (var routeInd in routeList) {
      var routeItem = routeList[routeInd]
      this[viewName][routeInd] = routeItem
      this[viewName][routeInd].$el = entryDom.querySelector('[view="' + viewName +'"] [route="' + routeItem._name +'"]')
      // 错误处理
      if (!this[viewName][routeInd].$el) {
        console.error('找不到视窗 ' + viewName + ' 中的路由: ' + routeItem._name)
        break
      }
      this[viewName][routeInd].$el.setAttribute('route-ind', routeInd)
      // console.log(urlViewName, )
      if (urlViewName && urlViewName == routeItem._name) {
        activeRouteIndex = routeInd
      }
    }
    // 激活对应路由
    _owo.showViewIndex(this[viewName], activeRouteIndex)
    _owo.handlePage(this[viewName][activeRouteIndex], this[viewName][activeRouteIndex].$el)
  }
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
    _owo.runCreated(templateScript)
  }

  owo.state.urlVariable = _owo.getQueryVariable()
  // 判断页面中是否有路由
  if (newPageFunction.view) {
    newPageFunction.view = new View(newPageFunction.view, entryDom)
  }
}

_owo.showViewIndex = function (routeList, ind) {
  for (var routeIndex = 0; routeIndex < routeList.length; routeIndex++) {
    var element = routeList[routeIndex];
    if (routeIndex == ind) {
      element.$el.style.display = 'block'
      element.$el.setAttribute('route-active', 'true')
    } else {
      element.$el.style.display = 'none'
      element.$el.removeAttribute('route-active')
    }
  }
}

_owo.showViewName = function (routeList, name) {
  for (var routeIndex = 0; routeIndex < routeList.length; routeIndex++) {
    var element = routeList[routeIndex];
    if (element._name == name) {
      element.$el.style.display = 'block'
      element.$el.setAttribute('route-active', 'true')
    } else {
      element.$el.style.display = 'none'
      element.$el.removeAttribute('route-active')
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