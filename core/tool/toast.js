/**
 * 显示toast提示
 * @param  {number} text       显示的文字
 * @param  {number} time       显示时长
 */

ozzx.tool.toast = (text, time) => {
  if (window.ozzx.state.toastClock) {
    clearTimeout(window.ozzx.state.toastClock)
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
  toast.style.background = 'rgba(0, 0, 0, 0.5)'
  toast.style.bottom = '10%'
  toast.style.height = '40px'
  toast.style.borderRadius = '10px'
  toast.style.width = '30%'
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
  document.body.append(toast)
  function hideToast() {
    document.getElementById('toast').remove()
    window.ozzx.state.toastClock = null
  }
  window.ozzx.state.toastClock = setTimeout(hideToast, time)
}