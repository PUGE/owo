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

owo.tool.change = function (environment, key, value) {
  environment.data[key] = value
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
    function tempRun (temp) {
      return eval(temp)
    }
    const value = tempRun.apply(environment, [temp])
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
  // console.log(environment, key, value)
}