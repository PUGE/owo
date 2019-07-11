
/**
 * 滑动检测
 * @param  {DOM} dom 需要监测的dom元素
 * @param  {number} endValue   结束数值
 */

owo.tool.touch = function (config) {
  const dom = config.el
  // 判断是否已经处于监听状态
  if (dom.getAttribute("monitor") == 'touch') return
  var start = null
  var end = null
  var startTarget = null
  // 设置监听标识
  dom.setAttribute("monitor", "touch")
  dom.addEventListener("touchstart", function (e) {
    event = e.targetTouches[0] || e.originalEvent.targetTouches[0]
    startTarget = e.target
    start = end = [event.clientX, event.clientY]
    if (config.start) config.start(event)
  }, false)
  dom.addEventListener("touchmove", function (e) {
    event = e.targetTouches[0] || e.originalEvent.targetTouches[0]
    end = [event.clientX, event.clientY]
    if (config.moveing) config.moveing(event)
  }, false)
  dom.addEventListener("touchend", function (e) {
    if (config.end) {
      config.end({
        target: startTarget,
        start,
        end,
        swipe: [end[0] - start[0], end[1] - start[1]]
      })
    }
  }, false)
}