/**
 * 打字机特效
 * @param  {Dom} dom       容器
 * @param  {string} text   字体内容
 * @param  {number} time   打字间隔
 */

owo.tool.typing = function (dom, text, time, finish, index) {
  owo.state.typing = true
  if (!dom) {
    console.error('第一个参数dom不能为空!')
    return
  }
  if (!text) {
    console.error('第二个参数text不能为空!')
    return
  }
  time = time || 200
  index = index || 0
  function typing() {
    if (index <= text.length) {
      // 如果是标点符号为了更字然增加打字间隔
      var tempTime = 0
      if ([',', '，', '”', '’', '.'].includes(text[index - 1])) {
        tempTime = 400
      } else if (['。'].includes(text[index - 1])) {
        tempTime = 1000
      }
      var showText = text.slice(0, index++)
      if (text[index - 1] == '&') {
        index = text.indexOf(';', index) + 1
        showText = text.slice(0, index)
      }
      if (text[index - 1] == '<') {
        index = text.indexOf('>', index) + 1
        showText = text.slice(0, index)
      }
      dom.innerHTML = showText + '_';
      setTimeout(function () {
        if (owo.state.typing) owo.tool.typing(dom, text, time, finish, index)
        else dom.innerHTML = text
      }, time + tempTime)
    }
    else {
      dom.innerHTML = text
      owo.state.typing = false
      // 完成回调
      if (finish) finish()
    }
  }
  typing()
}