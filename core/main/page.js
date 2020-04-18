function Page(pageScript, parentScript) {
  for (var key in pageScript) {
    this[key] = pageScript[key]
  }
  /* if="Storage.plugList.has('special_data')" */
  if (typeof this.data === 'function') {
    this.data = this.data()
  }
  /* end="Storage.plugList.has('special_data')" */
  // 处理页面引用的模板
  for (var key in pageScript.template) {
    pageScript.template[key].$el = pageScript.$el.querySelector('[template="' + key + '"]')
    pageScript.template[key] = new Page(pageScript.template[key])
  }
  if (parentScript) {
    this._parent = parentScript
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
  /* if="Storage.plugList.has('route')" */
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
  /* end="Storage.plugList.has('route')" */

  /* if="Storage.plugList.has('showcase')" */
  showcaseInit(this)
  /* end="Storage.plugList.has('showcase')" */
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
  /* if="Storage.plugList.has('if')" */
  // sdsddddddd
  if(!_owo._event_if(tempDom, moudleScript)) return
  /* end="Storage.plugList.has('if')" */
  
  /* if="Storage.plugList.has('for')" */
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
    /* if="Storage.plugList.has('if')" */
    // dd
    if(!_owo._event_if(tempDom, moudleScript)) return true
    /* end="Storage.plugList.has('if')" */
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
          var forValue = new Function('value', 'key', 'return ' + element)
          // 默认变量
          tempCopy = tempCopy.replace('{' + element + '}', forValue.apply(moudleScript, [value, key]))
        })
        outHtml += tempCopy
      }
      tempDom.outerHTML = outHtml + ''
    }
  })
  /* end="Storage.plugList.has('for')" */
  _owo.recursion(tempDom, function (childrenDom) {
    if (childrenDom.hasAttribute('o-for')) return true
    /* if="Storage.plugList.has('if')" */
    // 22222
    if(!_owo._event_if(childrenDom, moudleScript)) return true
    /* end="Storage.plugList.has('if')" */
    _owo.addEvent(childrenDom, moudleScript)
  })
  // 递归处理子模板
  for (var key in moudleScript.template) {
    moudleScript.template[key].$el = tempDom.querySelector('[template="' + key + '"]')
    handleEvent(moudleScript.template[key])
  }
}

Page.prototype.owoPageInit = owoPageInit
Page.prototype.handleEvent = handleEvent
Page.prototype.query = function (str) {
  return this.$el.querySelector(str)
}
Page.prototype.queryAll = function (str) {
  return this.$el.querySelectorAll(str)
}