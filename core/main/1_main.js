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

// 处理dom的owo事件
_owo.addEvent = function (tempDom, moudleScript) {
  if (tempDom.attributes) {
    for (var ind = 0; ind < tempDom.attributes.length; ind++) {
      var attribute = tempDom.attributes[ind]
      // ie不支持startsWith
      var eventFor = attribute.textContent || attribute.value
      eventFor = eventFor.replace(/ /g, '')
      // 判断是否为owo的事件
      if (attribute.name.slice(0, 2) == 'o-') {
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
            function inputEventHandle (e) {
              var eventFor = e.target.getAttribute('o-value')
              shaheRun.apply(moudleScript, [eventFor + '="' + e.target.value + '"'])
            }
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
                  case 'password':
                  case 'text':
                    if (value == undefined) value = ''
                    tempDom.value = value
                    tempDom.oninput = inputEventHandle
                    break;
                  case 'checkbox':
                    tempDom.checked = Boolean(value)
                    tempDom.onclick = function (e) {
                      var eventFor = e.target.getAttribute('o-value')
                      shaheRun.apply(moudleScript, [eventFor + '=' + e.target.checked])
                    }
                    break;
                  
                }
                break;
              case 'SELECT':
                tempDom.querySelector('[value="' + value + '"]').setAttribute('selected', 'selected')
                tempDom.oninput = inputEventHandle
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
}

_owo.recursion = function (tempDom, callBack) {
  if (!callBack || callBack(tempDom)) {
    return
  }
  // 判断是否有子节点需要处理
  if (tempDom.children) {
    // 递归处理所有子Dom结点
    for (var i = 0; i < tempDom.children.length; i++) {
      // 获取子节点实例
      var childrenDom = tempDom.children[i]
      if (!childrenDom.hasAttribute('template') && !childrenDom.hasAttribute('view')) {
        _owo.recursion(childrenDom, callBack)
      }
    }
  } else {
    console.info('元素不存在子节点!')
    console.info(tempDom)
  }
}

/* owo事件处理 */
// 参数1: 当前正在处理的dom节点
// 参数2: 当前正在处理的模块名称
function handleEvent (moudleScript, enterDom) {
  var moudleScript = moudleScript || this
  var enterDom = enterDom || moudleScript.$el
  // 判断是否是继承父元素方法
  if (moudleScript._inherit){
    moudleScript = moudleScript._parent
  }
  if (!enterDom) return
  var tempDom = enterDom
  /* if="this.plugList.includes('if')" */
  if(!_owo._event_if(tempDom, moudleScript)) return
  /* end */
  /* if="this.plugList.includes('for')" */
  // 先处理o-for
  _owo.recursion(tempDom, function (tempDom) {
    /* if="this.plugList.includes('if')" */
    if(!_owo._event_if(tempDom, moudleScript)) return true
    /* end */
    var forValue = tempDom.getAttribute('o-for')
    if (forValue) {
      // console.log(new Function('a', 'b', 'return a + b'))
      var forEle = shaheRun.apply(moudleScript, [forValue])
      // 如果o-for不存在则隐藏dom
      if (!forEle || forEle.length == 0) return
      if (!moudleScript['forList']) moudleScript['forList'] = []
      
      moudleScript['forList'].push({
        "for": forValue,
        "children": forEle.length,
        "template": tempDom.outerHTML
      })

      tempDom.removeAttribute("o-for")
      var tempNode = tempDom.cloneNode(true)
      var outHtml = ''
      
      for (var key in forEle) {
        tempNode.setAttribute('o-temp-for', forValue)
        var temp = tempNode.outerHTML
        var value = forEle[key];
        var tempCopy = temp
        // 获取模板插值
        var varList = _owo.cutStringArray(tempCopy, '{', '}')
        varList.forEach(element => {
          const forValue = new Function('value', 'key', 'return ' + element)
          // 默认变量
          tempCopy = tempCopy.replace('{' + element + '}', forValue.apply(moudleScript, [value, key]))
        })
        outHtml += tempCopy
      }
      tempDom.outerHTML = outHtml + ''
    }
  })
  /* end */
  _owo.recursion(tempDom, function (childrenDom) {
    if (childrenDom.hasAttribute('o-for')) return true
    /* if="this.plugList.includes('if')" */
    if(!_owo._event_if(childrenDom, moudleScript)) return true
    /* end */
    _owo.addEvent(childrenDom, moudleScript)
  })
  // 递归处理子模板
  for (var key in moudleScript.template) {
    moudleScript.template[key].$el = tempDom.querySelector('[template=' + key + ']')
    handleEvent(moudleScript.template[key])
  }
}

function owoPageInit () {
  // console.log(entryDom)
  // console.log(this)
  _owo.runCreated(this)
  for (var key in this.template) {
    var templateScript = this.template[key]
    _owo.runCreated(templateScript)
  }
  /* if="this.plugList.includes('route')" */
  // 判断页面中是否有路由
  if (this.view) {
    owo.state.urlVariable = _owo.getQueryVariable()
    temp = []
    for (var viewName in this.view) {
      var routeList = this.view[viewName]
      this.view[viewName] = new View(routeList, viewName, this['$el'], this)
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
      if (activeView) {
        activeView.owoPageInit()
        temp.push(this.view[viewName])
      }
    }
    this.view._list = temp
  }
  /* end */
}

/* if="this.plugList.includes('route')" */
window.addEventListener("popstate", function(e) { 
  _owo.getViewChange()
}, false);
/* end */

_owo.cutString = function (original, before, after, index) {
  index = index || 0
  if (typeof index === "number") {
    const P = original.indexOf(before, index)
    if (P > -1) {
      if (after) {const f = original.indexOf(after, P + before.length)
        // console.log(P, f)
        // console.log(original.slice(P + before.toString().length, f))
        return (f>-1)? original.slice(P + before.toString().length, f) : ''
      } else {
        return original.slice(P + before.toString().length);
      }
    } else {
      return ''
    }
  } else {
    console.error("owo [sizeTransition:" + index + "不是一个整数!]")
  }
}
_owo.cutStringArray = function (original, before, after, index, inline) {
  let aa=[], ab=0;
  index = index || 0
  
  while(original.indexOf(before, index) > 0) {
    const temp = this.cutString(original, before, after, index)
    if (temp !== '') {
      if (inline) {
        if (temp.indexOf('\n') === -1) {
          aa[ab] = temp
          ab++
        }
      } else {
        aa[ab] = temp
        ab++
      }
    }
    // console.log(before)
    index = original.indexOf(before, index) + 1
  }
  return aa;
},