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
  if (!oldDom) {
    console.error('旧页面不存在!')
  }
  oldDom.addEventListener("animationend", oldDomFun)
  newDom.addEventListener("animationend", newDomFun)
  
  oldDom.style.position = 'absolute'
  oldDom.style.overflow = 'hidden'

  newDom.style.display = 'block'
  newDom.style.position = 'absolute'
  // document.body.style.overflow = 'hidden'
  animationIn.split(',').forEach(value => {
    console.log('add:' +  value)
    oldDom.classList.add('ox-page-' + value)
    oldDom.classList.add('ozzx-animation')
  })
  animationOut.split(',').forEach(value => {
    console.log('add:' +  value)
    newDom.classList.add('ox-page-' + value)
    oldDom.classList.add('ozzx-animation')
  })
  // 旧DOM执行函数
  function oldDomFun () {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
    // console.log(oldDom)
    oldDom.style.position = ''
    // 清除临时设置的class
    animationIn.split(',').forEach(value => {
      console.log('del:' +  value)
      oldDom.classList.remove('ox-page-' + value)
      oldDom.classList.remove('ozzx-animation')
    })
    // 移除监听
    oldDom.removeEventListener('animationend', oldDomFun, false)
  }

  // 新DOM执行函数
  function newDomFun () {
    // 清除临时设置的style
    newDom.style.position = ''
    animationOut.split(',').forEach(value => {
      console.log('del:' +  value)
      newDom.classList.remove('ox-page-' + value)
      newDom.classList.remove('ozzx-animation')
    })
    // 移除监听
    newDom.removeEventListener('animationend', newDomFun, false)
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
    oldPage = ozzx.entry
  } else {
    oldPage = oldPage.split('&')[0]
  }
  var oldDom = document.getElementById('ox-' + oldPage)
  var newDom = document.getElementById('ox-' + newPage)
  
  if (!newDom) {
    console.error('页面不存在!')
    return
  }
  // 判断是否有动画效果
  if (newPagParamList.length > 1) {
    var animationIn = getQueryString(newUrlParam, 'in')
    var animationOut = getQueryString(newUrlParam, 'out')

    // 如果没用动画参数则使用默认效果
    if (!animationIn || !animationOut) {
      dispalyEffect(oldDom, newDom)
      return
    }
    animation(oldDom, newDom, animationIn, animationOut)
    
    
  } else {
    dispalyEffect(oldDom, newDom)
  }
  
  window.ozzx.activePage = newPage
  // 更改$data链接
  $data = ozzx.script[newPage].data
  runPageFunction(newPage, newDom)
}