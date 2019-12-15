/**
 * 改变数据
 * @return {object} 屏幕信息
 */

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
  console.log(environment, key, value)
}