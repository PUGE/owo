// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  for (var key in owo.script) {
    owo.script[key].$el = document.querySelector('.page[template="' + key + '"]')
    owo.script[key] = new Page(owo.script[key])
  }
  var firstPageList = document.querySelector('.page[template]')
  // 允许项目只有模块没有页面
  if (firstPageList) {
    owo.entry = firstPageList.getAttribute('template')
    // 查找入口
    if (!owo.script[owo.entry] || !owo.script[owo.entry].$el) {
      console.error('找不到页面入口!')
    } else {
      owo.activePage = owo.entry
      var activeScript = owo.script[owo.activePage]
      activeScript.owoPageInit()
      activeScript.handleEvent()
    }
  }
  // 处理插件
  var plugList = document.querySelectorAll('.owo-block')
  for (var ind = 0; ind < plugList.length; ind++) {
    var plugEL = plugList[ind]
    var plugName = plugEL.getAttribute('template')
    owo.script[plugName].$el = plugEL
    owo.script[plugName].owoPageInit()
    owo.script[plugName].handleEvent()
    plugEL.style.display = ''
  }
}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)
