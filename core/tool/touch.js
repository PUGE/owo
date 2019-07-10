
/**
 * 滑动检测
 * @param  {DOM} dom 需要监测的dom元素
 * @param  {number} endValue   结束数值
 */

owo.tool.touch = function (dom, fn) {
  var start = null
  var end = null
  dom.addEventListener("touchstart", function (e) {
    event = e.targetTouches[0] || e.originalEvent.targetTouches[0]
    start = end = [event.clientX, event.clientY]
  })
  dom.addEventListener("touchmove", function (e) {
    event = e.targetTouches[0] || e.originalEvent.targetTouches[0]
    end = [event.clientX, event.clientY]
  })
  dom.addEventListener("touchend", function (e) {
    fn({
      start,
      end,
      swipe: [end[0] - start[0], end[1] - start[1]]
    })
  })
}