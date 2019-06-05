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
  toast.style.position = 'fixed'
  toast.style.zIndex = 999
  toast.style['background-color'] = 'rgba(0, 0, 0, 0.5)'
  toast.style.bottom = '10%'
  toast.style.height = '40px'
  toast.style.borderRadius = '10px'
  toast.style.left = 0
  toast.style.right = 0
  toast.style.margin = 'auto'
  toast.style.lineHeight = '40px'
  toast.style.textAlign = 'center'
  toast.style.color = 'white'
  toast.style.maxWidth = '200px'
  toast.style.padding = '0 10px'
  toast.style.overflow = 'hidden'
  toast.style.textOverflow = 'ellipsis'
  toast.style.whiteSpace = 'nowrap'

  toast.innerHTML = text
  document.body.appendChild(toast)
  function hideToast() {
    document.getElementById('toast').outerHTML = ''
    window.owo.state.toastClock = null
  }
  window.owo.state.toastClock = setTimeout(hideToast, time)
}