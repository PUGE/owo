let storage = {
  clear: function () {
    this.watcherFile = {}
    this.animationList = []
  },
  // 需要监控的目录
  watcherFile: {},
  // 使用到的效果列表
  animationList: [],
  plugList: []
}

module.exports = storage