/**
 * 获取屏幕信息
 * @return {object} 屏幕信息
 */

owo.tool.getScreenInfo = () => {
  return {
    clientWidth: document.body.clientWidth,
    clientHeight: document.body.clientHeight,
    ratio: document.body.clientWidth / document.body.clientHeight,
    // 缩放比例
    devicePixelRatio: window.devicePixelRatio || 1
  }
}