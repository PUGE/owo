// 单页面-页面资源加载完毕事件
_owo.showPage = function() {
  for (var key in owo.script) {
    owo.script[key].$el = document.querySelector('.page[template="' + key + '"]')
    owo.script[key] = new Page(owo.script[key])
  }
  owo.entry = document.querySelector('.page[template]').getAttribute('template')
  // 查找入口
  if (!owo.script[owo.entry].$el) {
    console.error('找不到页面入口!')
    return
  }
  
  owo.activePage = owo.entry
  var activeScript = owo.script[owo.activePage]
  activeScript.owoPageInit()
  activeScript.handleEvent()
}

// 执行页面加载完毕方法
_owo.ready(_owo.showPage)
