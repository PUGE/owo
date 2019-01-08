'use strict'
const css = require('css')
const Templet = require('./templet')

function styleHandle (htmlText, name) {
  // 截取出CSS字符串
  const styleText = Templet.cutString(htmlText, "<style>", "</style>")
  // 解析css
  let style = css.parse(styleText)
  // 遍历css结构将选择器限制在页面内
  for (var ruleIndex = 0; ruleIndex < style.stylesheet.rules.length; ruleIndex++) {
    const selectors = style.stylesheet.rules[ruleIndex].selectors
    for (var selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
      style.stylesheet.rules[ruleIndex].selectors[selectorIndex] = `.ox-${name} ` + selectors[selectorIndex]
    }
    style.stylesheet.rules[ruleIndex]
  }
  // console.log(css.stringify(style))
  return css.stringify(style)
}
module.exports = styleHandle