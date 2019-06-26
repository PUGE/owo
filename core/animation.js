// 页面切换效果

// 获取URL参数
function getQueryString(newUrlParam, name) { 
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i")
  var r = newUrlParam.match(reg)
  if (r != null) return unescape(r[2])
  return null; 
}

// 无特效翻页
function dispalyEffect (oldDom, newDom) {
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
  }
  // 查找页面跳转后的page
  newDom.style.display = 'block'
}

// 切换页面动画
function animation (oldDom, newDom, animationIn, animationOut) {
  // 获取父元素
  var parentDom = newDom.parentElement
  if (!oldDom) {
    console.error('旧页面不存在!')
  }
  oldDom.addEventListener("animationend", oldDomFun)
  newDom.addEventListener("animationend", newDomFun)
  
  oldDom.style.position = 'absolute'

  newDom.style.display = 'block'
  newDom.style.position = 'absolute'
  // document.body.style.overflow = 'hidden'

  parentDom.style.perspective = '1200px'
  oldDom.classList.add('owo-animation')
  animationIn.split(',').forEach(value => {
    oldDom.classList.add('o-page-' + value)
    
  })

  newDom.classList.add('owo-animation')
  animationOut.split(',').forEach(value => {
    newDom.classList.add('o-page-' + value)
    
  })
  // 旧DOM执行函数
  function oldDomFun (e) {
    // 排除非框架引起的结束事件
    if (e.target.getAttribute('template')) {
      // 移除监听
      oldDom.removeEventListener('animationend', oldDomFun, false)
      // 隐藏掉旧的节点
      oldDom.style.display = 'none'
      // console.log(oldDom)
      oldDom.style.position = ''
      oldDom.classList.remove('owo-animation')
      parentDom.style.perspective = ''
      // 清除临时设置的class
      animationIn.split(',').forEach(value => {
        oldDom.classList.remove('o-page-' + value)
      })
    }
  }

  // 新DOM执行函数
  function newDomFun () {
    // 移除监听
    newDom.removeEventListener('animationend', newDomFun, false)
    // 清除临时设置的style
    newDom.style.position = ''
    newDom.classList.remove('owo-animation')
    animationOut.split(',').forEach(value => {
      newDom.classList.remove('o-page-' + value)
    })
  }
}


// 切换页面前的准备工作
function switchPage (oldUrlParam, newUrlParam) {
  var oldPage = oldUrlParam
  var newPage = newUrlParam
  let newPagParamList = newPage.split('&')
  if (newPage) newPage = newPagParamList[0]
  
  // 查找页面跳转前的page页(dom节点)
  // console.log(oldUrlParam)
  // 如果源地址获取不到 那么一般是因为源页面为首页
  if (oldPage === undefined) {
    oldPage = owo.entry
  } else {
    oldPage = oldPage.split('&')[0]
  }
  var oldDom = document.getElementById('o-' + oldPage)
  var newDom = document.getElementById('o-' + newPage)
  
  if (!newDom) {
    console.error('页面不存在!')
    return
  }
  // 判断是否有动画效果
  if (!owo.state.animation) owo.state.animation = {}
  // 直接.in会在ie下报错
  var animationIn = owo.state.animation['in']
  var animationOut = owo.state.animation['out']
  if (animationIn || animationOut) {
    // 如果没用动画参数则使用默认效果
    if (!animationIn || !animationOut) {
      dispalyEffect(oldDom, newDom)
      return
    }
    owo.state.animation = {}
    animation(oldDom, newDom, animationIn, animationOut)
  } else {
    dispalyEffect(oldDom, newDom)
  }
  
  window.owo.activePage = newPage
  _owo.handlePage(newPage, newDom)
}