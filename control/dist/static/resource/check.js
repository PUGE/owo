var screenInfo = {
  ua: navigator.userAgent
}

// 判断浏览器类型
screenInfo.isWindowsPhone = /(?:Windows Phone)/.test(screenInfo.ua),
screenInfo.isSymbian = /(?:SymbianOS)/.test(screenInfo.ua) || screenInfo.isWindowsPhone, 
screenInfo.isAndroid = /(?:Android)/.test(screenInfo.ua), 
screenInfo.isFireFox = /(?:Firefox)/.test(screenInfo.ua), 
screenInfo.isChrome = /(?:Chrome|CriOS)/.test(screenInfo.ua),
screenInfo.isTablet = /(?:iPad|PlayBook)/.test(screenInfo.ua) || (screenInfo.isAndroid && !/(?:Mobile)/.test(screenInfo.ua)) || (screenInfo.isFireFox && /(?:Tablet)/.test(screenInfo.ua))
screenInfo.isIPhone = /(?:iPhone)/.test(screenInfo.ua) && !screenInfo.isTablet,
screenInfo.isPc = !screenInfo.isPhone && !screenInfo.isAndroid && !screenInfo.isSymbian;

if (screenInfo.isPc) {
  document.body.classList.add('pc')
} else {
  document.body.classList.add('phone')
}

function getScreenInfo() {
  screenInfo.width = document.documentElement.clientWidth || document.body.offsetWidth || window.innerWidth
  screenInfo.height = document.documentElement.clientHeight || document.body.offsetHeight || window.innerHeight
    // 屏幕长宽比
  screenInfo.scale = (screenInfo.width / screenInfo.height).toFixed(2)

  // 判断横屏还是竖屏
  if (screenInfo.scale > 1) {
    document.body.classList.remove('vertical')
    document.body.classList.add('horizontal')
  } else {
    document.body.classList.remove('horizontal')
    document.body.classList.add('vertical')
  }
}

getScreenInfo()

var timer = null
window.addEventListener('resize', function () {
  window.clearTimeout(timer)
  timer = setTimeout(() => {
    getScreenInfo()
  }, 300)
})