/**
 * 以渐变方式更换图片
 * @param  {dom} el       dom元素
 * @param  {string} imgSrc     新的图片路径
 * @param  {number} time       动画时长
 */

owo.tool.fadeChangeImage = function (el, imgSrc, time) {
  if (!el || !imgSrc) return
  time = time || 300
  el.style.transition = 'opacity ' + time + 'ms linear'
  el.style.opacity = '0'
  setTimeout(() => {
    // 根据标签修改图片
    if (el.localName === 'img') {
      el.src = imgSrc
    } else {
      el.style.backgroundImage = 'url("' + imgSrc + '")'
    }
    el.style.opacity = ''
    setTimeout(() => {
      el.style.transition = ''
    }, time)
  }, time)
}