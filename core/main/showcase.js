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
/* end="Storage.plugList.has('showcase')" */