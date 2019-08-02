
owo.change = function (key, value) {
  // 更改对应的data
  owo.script[owo.activePage].data[key] = value
  // 当前页面下@show元素列表
  var showList = document.querySelector('[template=' + owo.activePage + ']').querySelectorAll('[\\:show="' + key + '"]')
  showList.forEach(element => {
    if (value) {
      element.style.display = ''
    } else {
      element.style.display = 'none'
    }
  })
}
