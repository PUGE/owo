if (!owo) {
  console.error('没有找到owo核心!')
}

// 注册owo默认变量
// 框架状态变量
owo.state = {}
// 框架全局变量
owo.global = {}
// 全局方法变量
owo.tool = {}

// 便捷的获取工具方法
var $tool = owo.tool
var $data = {}

// 框架核心函数
var _owo = {}

// 对象合并方法
_owo.assign = function(a, b) {
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
_owo.handlePage = function (pageName, entryDom) {
  _owo.handleEvent(entryDom)
  // 判断页面是否有自己的方法
  var newPageFunction = window.owo.script[pageName]
  if (!newPageFunction) return
  // console.log(newPageFunction)
  // 如果有created方法则执行
  if (newPageFunction.created) {
    // 注入运行环境
    newPageFunction.created.apply(_owo.assign(newPageFunction, {
      $el: entryDom,
      data: newPageFunction.data,
      activePage: window.owo.activePage
    }))
  }
  
  // 判断页面是否有下属模板,如果有运行所有模板的初始化方法
  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key]
    if (templateScript.created) {
      // 获取到当前配置页的DOM
      // 待修复,临时获取方式,这种方式获取到的dom不准确
      var domList = entryDom.getElementsByClassName('o-' + key)
      if (domList.length !== 1){
        console.error('我就说会有问题吧!')
        console.log(domList)
      }
      // 为模板注入运行环境
      templateScript.created.apply(_owo.assign(newPageFunction.template[key], {
        $el: domList[0].children[0],
        data: templateScript.data,
        activePage: window.owo.activePage
      }))
    }
  }
}

// owo-name处理
_owo.handleEvent = function (tempDom, templateName) {
  // console.log(templateName)
  var activePage = window.owo.script[owo.activePage]
  for (let ind = 0; ind < tempDom.attributes.length; ind++) {
    var attribute = tempDom.attributes[ind]
    // 判断是否为owo的事件
    // ie不支持startsWith
    if (attribute.name[0] == '@') {
      var eventName = attribute.name.slice(1)
      var eventFor = attribute.textContent
      switch (eventName) {
        case 'show' : {
          // 初步先简单处理吧
          var temp = eventFor.replace(/ /g, '')
          // 取出条件
          const condition = temp.split("==")
          if (activePage.data[condition[0]] != condition[1]) {
            tempDom.style.display = 'none'
          }
          break
        }
        default: {
          tempDom["on" + eventName] = function(event) {
            // 因为后面会对eventFor进行修改所以使用拷贝的
            var eventForCopy = eventFor
            // 判断页面是否有自己的方法
            var newPageFunction = window.owo.script[window.owo.activePage]
            // console.log(this.attributes)
            if (templateName) {
              // 如果模板注册到newPageFunction中，那么证明模板没有script那么直接使用eval执行
              if (newPageFunction.template) {
                newPageFunction = newPageFunction.template[templateName]
              } else {
                eval(eventForCopy)
                return
              }
            }
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
              eventForCopy = eventForCopy.replace('(' + parameterList + ')', '')
            } else {
              // 解决 @click="xxx()"会造成的问题
              eventForCopy = eventForCopy.replace('()', '')
            }
            // console.log(newPageFunction)
            // 如果有方法,则运行它
            if (newPageFunction[eventForCopy]) {
              // 绑定window.owo对象
              // console.log(tempDom)
              // 待测试不知道这样合并会不会对其它地方造成影响
              newPageFunction.$el = this
              newPageFunction.$event = event
              newPageFunction[eventForCopy].apply(newPageFunction, parameterArr)
            } else {
              // 如果没有此方法则交给浏览器引擎尝试运行
              eval(eventForCopy)
            }
          }
        }
      }
    }
  }

  // 递归处理所有子Dom结点
  for (var i = 0; i < tempDom.children.length; i++) {
    var childrenDom = tempDom.children[i]
    // console.log(childrenDom)
    let newTemplateName = templateName
    if (tempDom.attributes['template'] && tempDom.attributes['template'].textContent) {
      newTemplateName = tempDom.attributes['template'].textContent
    }
    // console.log(newTemplateName)
    _owo.handleEvent(childrenDom, newTemplateName)
  }
}

// 便捷选择器
if (window.jQuery == undefined) {
  window.$ = function (query) {
    const type = typeof query
    switch (type) {
      // 如果是一个函数,那么代表这个函数需要在页面加载完毕后运行
      case 'function': {
        setTimeout(() => {
          // 将需要运行的函数添加到待运行队列中
          if (window.owo.state.created == undefined) window.owo.state.created = []
          window.owo.state.created.push(query)
          // 如果页面已经处于准备就绪状态,那么直接运行代码
          if (window.owo.state.isRrady) {
            query()
          }
        }, 1000)
        break
      }
      case 'string': {
        var domList = document.querySelectorAll(query)
        return domList ? domList : []
      }
    }
  }
} else {
  // 因为jquery没有foreach方法 所以需要给他加上
  jQuery.fn.forEach = function (objec) {
    for (let index = 0; index < this.length; index++) {
      const element = this[index]
      objec(element)
    }
  }
}

// 跳转到指定页面
function $go (pageName, inAnimation, outAnimation, param) {
  owo.state.animation = {
    "in": inAnimation,
    "out": outAnimation
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

function $change (key, value) {
  // 更改对应的data
  owo.script[owo.activePage].data[key] = value
  // 当前页面下@show元素列表
  var showList = document.getElementById('o-' + owo.activePage).querySelectorAll('[\\@show]')
  showList.forEach(element => {
    // console.log(element)
    var order = element.attributes['@show'].textContent
    // console.log(order)
    // 去掉空格
    order = order.replace(/ /g, '')
    if (order == key + '==' + value) {
      element.style.display = ''
    } else {
      element.style.display = 'none'
    }
  })
}
