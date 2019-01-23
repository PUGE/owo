'use strict'
const css = require('css')
const sassRender = require('node-sass')
const lessRender = require('less')
const Templet = require('../templet')

function styleHandle (htmlText, name) {
  // 是否需要预处理css
  const styleLabel = Templet.cutString(htmlText, "<style", ">")
  const lang = Templet.cutString(styleLabel, 'lang="', '"')

  // 截取出CSS字符串
  let styleText = Templet.cutString(htmlText, htmlText.match(/<style.*?>/), "</style>")
  // console.log(styleText)
  // 如果设置需要使用预处理插件处理则使用对应的插件
  if (lang === "sass") {
    styleText = sassRender.renderSync({data: styleText}).css.toString()
  } else if (lang === "less") {
    lessRender.render(styleText, (e, output) => {
      styleText = output.css
    })
  }
  // 解析css
  let style = css.parse(styleText)
  // 遍历css结构将选择器限制在页面内
  for (var ruleIndex = 0; ruleIndex < style.stylesheet.rules.length; ruleIndex++) {
    const selectors = style.stylesheet.rules[ruleIndex].selectors
    if (selectors) {
      for (var selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
        style.stylesheet.rules[ruleIndex].selectors[selectorIndex] = `.ox-${name} ` + selectors[selectorIndex]
      }
    } else {
      console.warn('selectors为空')
    }
    
  }
  return css.stringify(style)
}
module.exports = styleHandle