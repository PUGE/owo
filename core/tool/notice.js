owo.tool.notice = function (text, config) {
  config = config || {}
  var showTime = config.showTime || 2000
  var container = config.container || document.body
  var remind = document.createElement("div")
  remind.setAttribute("id", "remind")
  remind.style.cssText = 'position: fixed;right: -200px;bottom: 5%;background-color: #009fe9;color: white;padding: 5px 10px;border-radius: 5px 0 0 5px;width: 180px;transition: right 0.4s, opacity 0.4s;font-size: 16px;line-height: 1.6;cursor: pointer;box-shadow: 1px 2px 7px #c4d3da;'
  remind.innerHTML = text
  container.appendChild(remind)
  setTimeout(() => {
    remind.style.right = '0'
    setTimeout(() => {
      remind.style.right = '-200px'
      setTimeout(() => {
        document.getElementById('remind').outerHTML = ''
      }, 400);
    }, showTime);
  }, 0)
}