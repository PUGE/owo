'use strict'
const fs = require('fs')
const path = require('path')
const css = require('css')
const Cut = require('../cut')
// 配置输出插件
const log = require('../log')()

function styleHandle (htmlText, name) {
  // 是否需要预处理css
  const styleLabel = Cut.string(htmlText, "<style", ">")
  const lang = Cut.string(styleLabel, 'lang="', '"')

  // 截取出CSS字符串
  let styleText = Cut.string(htmlText, htmlText.match(/<style.*?>/), "</style>")
  // console.log(styleText)
  // 如果设置需要使用预处理插件处理则使用对应的插件
  if (lang === "sass") {
    // sass模块目录
    const sassPath = path.join(process.cwd(), 'node_modules', 'node-sass')
    if (!fs.existsSync(sassPath)) {
      throw '请使用 npm i -save node-sass 或 yarn add node-sass 安装sass模块!'
    }
    const sassRender = require(sassPath)
    styleText = sassRender.renderSync({data: styleText}).css.toString()
  } else if (lang === "less") {
    const lessPath = path.join(process.cwd(), 'node_modules', 'less')
    // 判断是否安装了less
    if (!fs.existsSync(lessPath)) {
      throw '请使用 npm i -save less 或 yarn add less 安装less模块!'
    }
    const lessRender = require(lessPath)
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
      log.debug(`发现 ${style.stylesheet.rules[ruleIndex].type} 规则: ${style.stylesheet.rules[ruleIndex].name}`)
    }
    
  }
  return css.stringify(style)
}
module.exports = styleHandle