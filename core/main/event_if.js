
/* if="Storage.plugList.has('if')" */
_owo._event_if = function (tempDom, moudleScript) {
  // o-if处理
  var ifValue = tempDom.getAttribute('o-if')
  if (ifValue) {
    var temp = ifValue.replace(/ /g, '')
    var show = shaheRun.apply(moudleScript, [temp])
    if (!show) {
      tempDom.style.display = 'none'
      return false
    } else {
      tempDom.style.display = ''
    }
  }
  return true
}
/* end="Storage.plugList.has('if')" */