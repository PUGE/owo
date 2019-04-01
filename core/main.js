// 对象合并方法
function assign(a, b) {
  var newObj = {}
  for (var key in a){
    newObj[key] = a[key]
  }
  for (var key in b){
    newObj[key] = b[key]
  }
  return newObj
}

// 运行页面所属的方法
function runPageFunction (pageName, entryDom) {
  // ozzx-name处理
  window.ozzx.domList = {}
  pgNameHandler(entryDom)

  // 判断页面是否有自己的方法
  var newPageFunction = window.ozzx.script[pageName]
  if (!newPageFunction) return
  // console.log(newPageFunction)
  // 如果有created方法则执行
  if (newPageFunction.created) {
    // 注入运行环境
    newPageFunction.created.apply(assign(newPageFunction, {
      $el: entryDom,
      data: newPageFunction.data,
      activePage: window.ozzx.activePage,
      domList: window.ozzx.domList
    }))
  }
  
  // 判断页面是否有下属模板,如果有运行所有模板的初始化方法
  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key]
    if (templateScript.created) {
      // 获取到当前配置页的DOM
      // 待修复,临时获取方式,这种方式获取到的dom不准确
      var domList = entryDom.getElementsByClassName('ox-' + key)
      if (domList.length !== 1){
        console.error('我就说会有问题吧!')
        console.log(domList)
      }
      // 为模板注入运行环境
      templateScript.created.apply(assign(newPageFunction.template[key], {
        $el: domList[0].children[0],
        data: templateScript.data,
        activePage: window.ozzx.activePage,
        domList: window.ozzx.domList
      }))
    }
  }
}

// ozzx-name处理
function pgNameHandler (tempDom) {
  // 判断是否存在@name属性
  var pgName = tempDom.attributes['@name']
  if (pgName) {
    // console.log(pgName.textContent)
    // 隐藏元素
    tempDom.hide = function () {
      this.style.display = 'none'
    }
    window.ozzx.domList[pgName.textContent] = tempDom
  }
  // 判断是否有点击事件
  var clickFunc = tempDom.attributes['@click']
  
  if (clickFunc) {
    
    tempDom.onclick = function(event) {
      var clickFor = this.attributes['@click'].textContent
      // 判断页面是否有自己的方法
      var newPageFunction = window.ozzx.script[window.ozzx.activePage]
      // console.log(this.attributes)
      // 判断是否为模板
      var templateName = this.attributes['template']
      // console.log(templateName)
      if (templateName) {
        newPageFunction = newPageFunction.template[templateName.textContent]
      }
      
      // 取出参数
      var parameterArr = []
      var parameterList = clickFor.match(/[^\(\)]+(?=\))/g)
      
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
        clickFor = clickFor.replace('(' + parameterList + ')', '')
      } else {
        // 解决 @click="xxx()"会造成的问题
        clickFor = clickFor.replace('()', '')
      }
      // console.log(newPageFunction)
      // 如果有方法,则运行它
      if (newPageFunction[clickFor]) {
        // 绑定window.ozzx对象
        // console.log(tempDom)
        // 待测试不知道这样合并会不会对其它地方造成影响
        newPageFunction.$el = this
        newPageFunction.$event = event
        newPageFunction.domList = window.ozzx.domList
        newPageFunction[clickFor].apply(newPageFunction, parameterArr)
      } else {
        // 如果没有此方法则交给浏览器引擎尝试运行
        eval(this.attributes['@click'].textContent)
      }
    }
  }
  // 递归处理所有子Dom结点
  for (var i = 0; i < tempDom.children.length; i++) {
    var childrenDom = tempDom.children[i]
    // console.log(childrenDom)
    pgNameHandler(childrenDom)
  }
}

// 便捷获取被命名的dom元素
function $dom (domName) {
  return ozzx.domList[domName]
}

// 跳转到指定页面
function $go (pageName, inAnimation, outAnimation, param) {
  ozzx.state.animation = {
    in: inAnimation,
    out: outAnimation
  }
  var paramString = ''
  if (param && typeof param == 'object') {
    paramString += '?'
    // 生成URL参数
    for (let paramKey in param) {
      paramString += paramKey + '=' + param[paramKey] + '&'
    }
    // 去掉尾端的&
    paramString = paramString.slice(0, -1)
  }
  window.location.href = paramString + "#" + pageName
}
