/**
 * 显示toast提示 不支持ie8
 * @param  {number} text       显示的文字
 * @param  {number} time       显示时长
 */

owo.tool.toast = (text, time) => {
  if (window.owo.state.toastClock) {
    clearTimeout(window.owo.state.toastClock)
    hideToast()
  }
  if (time === undefined || time === null) {
    // 默认2秒
    time = 2000
  }
  const toast = document.createElement("div")
  toast.setAttribute("id", "toast")
  toast.setAttribute("class", "toast")
  // 设置样式
  toast.style.cssText = "position:fixed;z-index:999;background-color:rgba(0, 0, 0, 0.5);bottom:10%;line-height:40px;border-radius:10px;left:0;right:0;margin:0 auto;text-align:center;color:white;max-width:200px;padding:0 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"

  toast.innerHTML = text
  document.body.appendChild(toast)
  function hideToast() {
    document.getElementById('toast').outerHTML = ''
    window.owo.state.toastClock = null
  }
  window.owo.state.toastClock = setTimeout(hideToast, time)
}