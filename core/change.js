
function $change (key, value) {
  // 更改对应的data
  owo.script[owo.activePage].data[key] = value
  // 当前页面下@show元素列表
  var showList = document.getElementById('o-' + owo.activePage).querySelectorAll('[\\@show]')
  showList.forEach(element => {
    // console.log(element)
    var order = element.attributes['@show'].textContent
    // console.log(order)
    // 去掉空格
    order = order.replace(/ /g, '')
    if (order == key + '==' + value) {
      element.style.display = ''
    } else {
      element.style.display = 'none'
    }
  })
}
