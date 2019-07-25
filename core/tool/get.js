/**
 * 发送get请求
 * @param  {string} url       显示的文字
 * @param  {function} fn       显示时长
 */

owo.tool.get = function (url, fn) {
  const obj = new XMLHttpRequest()       
  obj.open('GET', url, true)
  obj.onreadystatechange = function () {
    if (obj.readyState === 4) {
      if (obj.status === 200 || obj.status === 304) {
        fn.call(this, obj.responseText)
      }
    }
  }
  obj.send(null)
}