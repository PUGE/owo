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
  
  var showList = environment.$el.querySelectorAll('[o-show]')
  for (var ind = 0; ind < showList.length; ind++) {
    var showDom = showList[ind]
    var temp = showDom.getAttribute('o-show').replace(/ /g, '')
    function tempRun (temp) {
      return eval(temp)
    }
    if (tempRun.apply(environment, [temp])) {
      showDom.style.display = ''
    } else {
      showDom.style.display = 'none'
    }
  }
  var valueList = environment.$el.querySelectorAll('[o-value]')
  for (var ind = 0; ind < valueList.length; ind++) {
    var valueDom = valueList[ind]
    var temp = valueDom.getAttribute('o-value').replace(/ /g, '')
    const value = (function (temp) {
      try {
        return eval(temp)
      } catch (error) {
        return undefined
      }
    }).apply(environment, [temp])
    // console.log(value)
    valueDom.value = value
  }
  for (var key in environment.template) {
    const templateItem = environment.template[key]
    for (var key2 in templateItem.propMap) {
      const propMapItem = templateItem.propMap[key2]
      templateItem.prop[key2] = _owo.getValueFromScript(propMapItem.split('.'), environment)
    }
  }
  var htmlList = environment.$el.querySelectorAll('[o-html]')
  for (var ind = 0; ind < htmlList.length; ind++) {
    var valueDom = htmlList[ind]
    var temp = valueDom.getAttribute('o-html').replace(/ /g, '')
    const value = (function (temp) {
      try {
        return eval(temp)
      } catch (error) {
        return undefined
      }
    }).apply(environment, [temp])
    // console.log(value)
    valueDom.innerHTML = value
  }
  // console.log(environment, key, value)
}