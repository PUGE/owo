var autoScaleInfo = {
  // 设计宽度
  deviseW: 750,
  // 设计高度
  deviseH: 1508,
}

function getScale () {
  document.body.style.opacity = 0
  const scaleBox = document.getElementsByClassName('scale-box')[0]
  // 如果比例大于1则进入电脑模式
  autoScaleInfo.innerWidth = window.innerWidth
  autoScaleInfo.innerHeight = window.innerHeight
  if ((autoScaleInfo.innerWidth / autoScaleInfo.innerHeight) < 1) {
    var scale = autoScaleInfo.innerWidth / autoScaleInfo.deviseW
    autoScaleInfo.scale = scale
    scaleBox.style.width = autoScaleInfo.deviseW + 'px'
    scaleBox.style.height = autoScaleInfo.deviseH + 'px'
    autoScaleInfo.hideHeight = (autoScaleInfo.innerHeight - autoScaleInfo.deviseH * scale) / 2 /scale
    scaleBox.style.transform = `scale(${scale}, ${scale}) translate(0, ${autoScaleInfo.hideHeight}px)`
    scaleBox.style.transformOrigin = `0px 0px 0px`
    autoScaleInfo.showHeight = autoScaleInfo.innerHeight / autoScaleInfo.scale
    autoScaleInfo.showWidth = autoScaleInfo.innerWidth / autoScaleInfo.scale
  } else {
    document.body.classList.add('pc')
    var scale = (autoScaleInfo.innerHeight / autoScaleInfo.deviseH).toFixed(2)
    scaleBox.style.width = autoScaleInfo.deviseW + 'px'
    scaleBox.style.height = autoScaleInfo.deviseH + 'px'
    scaleBox.style.overflow = 'hidden'
    scaleBox.style.transform = `scale(${scale}, ${scale}) translate(${(autoScaleInfo.innerWidth - autoScaleInfo.deviseW * scale) / 2 / scale + 'px' }, 0)`
    scaleBox.style.transformOrigin = '0 0 0'
  }
  setTimeout(() => {
    document.body.style.opacity = 1
  }, 0);
}

getScale()

let timer = null

function refreshGetScale () {
  console.log("重新计算")
  window.clearTimeout(timer)
  timer = setTimeout(() => {
    getScale()
  }, 300)
}

window.addEventListener('resize', refreshGetScale)

// 微信返回自动重新排版布局
window.addEventListener('pageshow', refreshGetScale)