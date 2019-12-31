/**
 * 打字机特效
 * @param  {Dom} dom       容器
 * @param  {string} text   字体内容
 * @param  {number} time   打字间隔
 */

owo.tool.typing = function (dom, text, time, finish, index) {
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
      if ([',', '，', '”', '’'].includes(text[index - 1])) {
        tempTime = 400
      } else if (['.', '。'].includes(text[index - 1])) {
        tempTime = 1000
      }
      dom.innerHTML = text.slice(0, index++) + '_';
      setTimeout(function () {
        owo.tool.typing(dom, text, time, finish, index)
      }, time + tempTime)
    }
    else {
      dom.innerHTML = text
      // 完成回调
      if (finish) finish()
    }
  }
  typing()
}