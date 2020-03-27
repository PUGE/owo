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

_owo.getFuncformObj = function (pageFunction, pathStr) {
  if (!pageFunction) {
    return false
  }
  var pointFunc = pageFunction
  var pathList = pathStr.split('.')
  for (var ind = 0; ind < pathList.length; ind++) {
    var path = pathList[ind];
    if (pointFunc[path]) pointFunc = pointFunc[path]
    else {
      return false
    }
  }
  return pointFunc
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
  newPageFunctionTemp = _owo.getFuncformObj(newPageFunction, eventForCopy)
  if (newPageFunctionTemp) {
    // 绑定window.owo对象
    newPageFunction.$event = event
    newPageFunction.$target = event.target
    newPageFunctionTemp.apply(newPageFunction, parameterArr)
  } else {
    shaheRun.apply(newPageFunction, [eventFor])
  }
}

_owo.bindEvent = function (eventName, eventFor, tempDom, moudleScript) {
  switch (eventName) {
    case 'tap':
      // 变量
      var startTime = 0
      var isMove = false
      tempDom.ontouchstart = function () {
        startTime = Date.now();
      }
      tempDom.ontouchmove = function () {
        isMove = true
      }
      tempDom.ontouchend = function (event) {
        if (Date.now() - startTime < 300 && !isMove) {_owo._run(eventFor, event || this, moudleScript)}
        // 清零
        startTime = 0;
        isMove = false
      }
      break;
  
    default:
      // 防止重复绑定
      if (tempDom['owo_bind_' + eventName] !== eventFor) {
        tempDom['owo_bind_' + eventName] = eventFor
      
        tempDom.addEventListener(eventName, function(event) {
          _owo._run(eventFor, event || this, moudleScript)
        }, false)
      }
      break;
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
          case 'if':
            break
          case 'tap': {
            // 根据手机和PC做不同处理
            if (_owo.isMobi) _owo.bindEvent('tap', eventFor, tempDom, moudleScript)
            else _owo.bindEvent('click', eventFor, tempDom, moudleScript)
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
                var activeOpt = tempDom.querySelector('[value="' + value + '"]')
                if (!activeOpt) {console.error('找不到应该活跃的选项: ' + value); return;}
                activeOpt.setAttribute('selected', 'selected')
                tempDom.oninput = inputEventHandle
                break;
              default:
                tempDom.innerHTML = value
                break;
            }
            break
          }
          /* if="this.plugList.has('active')" */
          case 'active': {
            var value = shaheRun.apply(moudleScript, [eventFor])
            if (Boolean(value)) {
              tempDom.classList.add('active')
            } else {
              tempDom.classList.remove('active')
            }
          }
          /* end="this.plugList.has('active')" */
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
  /* if="this.plugList.has('if')" */
  // sdsddddddd
  if(!_owo._event_if(tempDom, moudleScript)) return
  /* end="this.plugList.has('if')" */
  
  /* if="this.plugList.has('for')" */
  if (moudleScript['forList']) {
    // 处理o-for
    for (var key in moudleScript['forList']) {
      var forItem = moudleScript['forList'][key];
      var forDomList = tempDom.querySelectorAll('[otemp-for="' + forItem['for'] + '"]')
      if (forDomList.length > 0) {
        forDomList[0].outerHTML = forItem.template
        for (var domIndex = 1; domIndex < forDomList.length; domIndex++) {
          forDomList[domIndex].remove()
        }
      }
    }
  }
  // 先处理o-for
  _owo.recursion(tempDom, function (tempDom) {
    /* if="this.plugList.has('if')" */
    // dd
    if(!_owo._event_if(tempDom, moudleScript)) return true
    /* end="this.plugList.has('if')" */
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
        tempNode.setAttribute('otemp-for', forValue)
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
  /* end="this.plugList.has('for')" */
  _owo.recursion(tempDom, function (childrenDom) {
    if (childrenDom.hasAttribute('o-for')) return true
    /* if="this.plugList.has('if')" */
    // 22222
    if(!_owo._event_if(childrenDom, moudleScript)) return true
    /* end="this.plugList.has('if')" */
    _owo.addEvent(childrenDom, moudleScript)
  })
  // 递归处理子模板
  for (var key in moudleScript.template) {
    moudleScript.template[key].$el = tempDom.querySelector('[template="' + key + '"]')
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
  /* if="this.plugList.has('route')" */
  // 判断页面中是否有路由
  if (this.view) {
    owo.state.urlVariable = _owo.getQueryVariable()
    temp = []
    for (var viewName in this.view) {
      var routeList = this.view[viewName]
      this.view[viewName] = new View(routeList, viewName, this['$el'], this)
      // 标识是否没有指定显示哪个路由
      // 从url中获取路由信息
      var urlViewName = owo.state.urlVariable['view-' + viewName]
      // 判断url中是否有路由信息，如果没有显示第一个路由
      var activeRouteIndex = urlViewName ? this.view[viewName][urlViewName]._index : 0

      // 激活对应路由
      this.view[viewName].showIndex(activeRouteIndex)
      var activeView = this.view[viewName]._list[activeRouteIndex]
      temp.push(this.view[viewName])
    }
    this.view._list = temp
  }
  /* end="this.plugList.has('route')" */
}

/* if="this.plugList.has('route')" */
window.addEventListener("popstate", function(e) { 
  _owo.getViewChange()
}, false);
/* end="this.plugList.has('route')" */

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
}