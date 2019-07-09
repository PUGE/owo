
/* 运行页面所属的方法 */
_owo.handlePage = function (newPageFunction, entryDom) {
  newPageFunction['$el'] = entryDom
  // 快速选择器
  newPageFunction['query'] = function (str) {
    return this.$el.querySelectorAll(str)
  }
  /* 判断页面是否有自己的方法 */
  if (!newPageFunction) return
  // console.log(newPageFunction)
  // 如果有created方法则执行
  if (newPageFunction.created) {
    _owo.runCreated(newPageFunction)
  }

  // 判断页面是否有下属模板,如果有运行所有模板的初始化方法
  for (var key in newPageFunction.template) {
    var templateScript = newPageFunction.template[key]
    // 待修复,临时获取方式,这种方式获取到的dom不准确
    var childDom = document.querySelectorAll('[template="' + key +'"]')[0]
    // 递归处理
    _owo.handlePage(templateScript, childDom)
  }
}