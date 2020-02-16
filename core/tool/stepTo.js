owo.tool.stepTo = function(step, config) {
  if (!step) return
  config = config || {}
  var activeIndex = 0 
  var pageList = document.querySelectorAll('.page[template]')
  for (var index = 0; index < pageList.length; index++) {
    var element = pageList[index];
    if (element.getAttribute('template') == owo.activePage) {
      activeIndex = index
    }
  }
  if (pageList[activeIndex + step]) {
    config.page = pageList[activeIndex + step].getAttribute('template')
  }
  owo.go(config)
}