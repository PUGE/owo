/**
 * 改变数据
 * @return {object} 屏幕信息
 */

_owo.getValueFromScript = function (arr, data) {
  var returnData = data
  for (let index = 0; index < arr.length; index++) {
    const element = arr[index];
    if (returnData[element] !== undefined) {
      returnData = returnData[element]
    } else {
      return undefined
    }
  }
  return returnData
}

owo.tool.change = function (environment, obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      environment.data[key] = value
    }
  }
  // 递归
  function recursion(el) {
    // 判断o-show
    var showValue = el.getAttribute('o-show')
    if (showValue) {
      var temp = showValue.replace(/ /g, '')
      function tempRun (temp) {
        return eval(temp)
      }
      if (tempRun.apply(environment, [temp])) {
        showDom.style.display = ''
      } else {
        showDom.style.display = 'none'
      }
    }
    var valueValue = el.getAttribute('o-value')
    if (valueValue) {
      var temp = valueValue.replace(/ /g, '')
      const value = (function (temp) {
        try {
          return eval(temp)
        } catch (error) {
          return undefined
        }
      }).apply(environment, [temp])
      switch (el.tagName) {
        case 'INPUT':
          switch (el.getAttribute('type')) {
            case 'text':
              el.value = value
              break;
            case 'checkbox':
              el.checked = Boolean(value)
              break;
          }
          break;
      }
      
    }
    var htmlValue = el.getAttribute('o-html')
    if (htmlValue) {
      var temp = htmlValue.replace(/ /g, '')
      const value = (function (temp) {
        try {
          return eval(temp)
        } catch (error) {
          return undefined
        }
      }).apply(environment, [temp])
      // console.log(value)
      temp.innerHTML = value
    }
    // 判断元素是否还属于当前模块
    if (!el.getAttribute('view') && !el.getAttribute('template')) {
      // 递归子元素
      for (let index = 0; index < el.children.length; index++) {
        const element = el.children[index]
        recursion(element)
      }
    }
    
  }
  recursion(environment.$el)
  for (var key in environment.template) {
    const templateItem = environment.template[key]
    for (var key2 in templateItem.propMap) {
      const propMapItem = templateItem.propMap[key2]
      templateItem.prop[key2] = _owo.getValueFromScript(propMapItem.split('.'), environment)
    }
  }
}