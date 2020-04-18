/* if="Storage.plugList.has('showcase')" */
function Showcase(showcaseEL) {
  this.name = showcaseEL.getAttribute('showcase')
  this.activeIndex = 0
  this.$el = showcaseEL
  this.count = showcaseEL.children.length
  this.children = showcaseEL.children
  this.next = function () {
    var newActive = this.activeIndex + 1
    if (newActive >= (this.count - 1)) newActive = 0
    _owo.animation(this.children[this.activeIndex], this.children[newActive])
    this.activeIndex = newActiveIndex
  }
  this.prev = function () {
    var newActive = this.activeIndex - 1
    if (newActive <= 0) newActive = this.count - 1
    _owo.animation(this.children[this.activeIndex], this.children[newActive])
    this.activeIndex = newActiveIndex
  },
  this.go = function (newActiveIndex) {
    newActiveIndex = parseInt(newActiveIndex)
    _owo.animation(this.children[this.activeIndex], this.children[newActiveIndex])
    this.activeIndex = newActiveIndex
  }
}

// 初始化橱窗组件
function showcaseInit (pageFunction) {
  if (!pageFunction.showcase) pageFunction.showcase = {}
  var showcaseEL = pageFunction.$el.querySelectorAll('[showcase]')
  for (var index = 0; index < showcaseEL.length; index++) {
    var element = showcaseEL[index];
    var name = element.getAttribute('showcase')
    pageFunction.showcase[name] = new Showcase(element)
    // 获取url参数
    owo.state.urlVariable = _owo.getQueryVariable()
    // 从url中获取路由信息
    var urlShowcaseIndex = owo.state.urlVariable['showcase-' + name]
    
    if (urlShowcaseIndex) {
      var activeIndex = parseInt(urlShowcaseIndex)
      pageFunction.showcase[name].activeIndex = activeIndex
      element.children[activeIndex].style.display = 'block'
    } else {
      // 显示第一条
      element.children[0].style.display = 'block'
    }
  }
}
/* end="Storage.plugList.has('showcase')" */