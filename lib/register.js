const path = require('path')
const AlertLink = require('./tool/alertLink.js')
const alertLink = new AlertLink()
const handleLink = require('./tool/handleLink.js')
// 配置输出插件
const log = require('./tool/log')
// html美化
const beautify_html = require('js-beautify').html;
const clearNoUse = require('./tool/clearNoUse')

// 处理heard
const register = {
  // 获取到模块Script
  handleTemplateScript: function (data) {
    return data
  },
  HandleScriptEnd: function (data) {
    // 清理数据
    data = clearNoUse(data)
    return data
  },
  outPutHtml: function (data, config) {
    if (!config.debug) {
      // 美化html
      log.debug('开始美化html')
      data = beautify_html(data, {
        indent_size: 2,
        inline: [
          "abbr", "area", "b", "bdi", "bdo", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "dfn", "em", "i", "iframe", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript", "object", "output", "progress", "q", "ruby", "s", "samp", "small", "strong", "sub", "sup", "svg", "template", "time", "u", "var", "wbr", "text", "acronym", "address", "big", "dt", "ins", "strike", "tt"
        ],
        space_in_empty_paren: false
      })

    }
    // 判断是否需要提示外链信息
    if (config.alertLink) {
      log.info('判断html中的外链情况!')
      alertLink.add(data)
    }
    // 判断是否需要处理外链信息
    if (config.handleLink) {
      const outPutPath = path.join(process.cwd(), config.outFolder)
      log.info('判断html中的外链情况!')
      data = handleLink(data, outPutPath + '/static/resource/')
    }
    return data
  },
  outPutStyle: function (data, config) {
    // 判断是否需要提示外链信息
    if (config.alertLink) {
      log.info('判断html中的外链情况!')
      alertLink.add(data)
    }
    return data
  },
  packFinish: function (config) {
    // 判断是否需要提示外链信息
    if (config.alertLink) {
      log.info('显示外链情况!')
      alertLink.show()
    }
  },
  downloadTemplate: function (data) {
    return data
  }
}

module.exports = register