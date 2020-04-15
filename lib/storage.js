let storage = {
  clear: function () {
    this.watcherFile = {}
    this.animationList = []
  },
  // 需要监控的目录
  watcherFile: {},
  // 使用到的效果列表
  animationList: [],
  // 动画列表
  animateList: new Set(),
  // 页面切换代码
  pageAnimationList: new Set(),
  // 插件列表
  plugList: new Set()
}

module.exports = storage