'use strict'
const fs = require('fs')
const path = require('path')
const css = require('css')
const Tool = require('../tool/tool')
// 配置输出插件
const log = require('../tool/log')

function styleHandle (htmlText, boxClassList, tagName, useOriginal) {
  // 是否需要预处理css
  const styleLabel = Tool.cutString(htmlText, "<style", ">")
  const lang = Tool.cutString(styleLabel, 'lang="', '"')

  // 截取出CSS字符串
  let styleText = Tool.cutString(htmlText, htmlText.match(/<style.*?>/), "</style>")
  // console.log(styleText)
  // 如果设置需要使用预处理插件处理则使用对应的插件
  if (lang === "sass") {
    const sassRender = require('node-sass')
    styleText = sassRender.renderSync({data: styleText}).css.toString()
  } else if (lang === "less") {
    const lessRender = require('less')
    lessRender.render(styleText, (e, output) => {
      if (e) throw Error(e)
      else styleText = output.css
    })
  }
  // 解析css
  let style = css.parse(styleText)
  // 判断是否有原始字段，如果有original字段则原样输出
  if (!styleLabel.includes('original') && !useOriginal) {
    log.debug(`使用局部样式!`)
    // 遍历css结构将选择器限制在页面内
    for (let ruleIndex = 0; ruleIndex < style.stylesheet.rules.length; ruleIndex++) {
      const selectors = style.stylesheet.rules[ruleIndex].selectors
      if (selectors) {
        for (let selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
          // console.log(selectors[selectorIndex].split(' ')[0])
          let classListTemp = []
          boxClassList.forEach(element => {
            classListTemp.push('.' + element)
          })
          const firstSelectors = selectors[selectorIndex].split(' ')[0]
          if (classListTemp.includes(firstSelectors) || tagName == firstSelectors) {
            style.stylesheet.rules[ruleIndex].selectors[selectorIndex] = selectors[selectorIndex]
          } else {
            // console.log(templeName)
            style.stylesheet.rules[ruleIndex].selectors[selectorIndex] = `.${boxClassList[0]} ` + selectors[selectorIndex]
          }
        }
      } else {
        log.debug(`发现 ${style.stylesheet.rules[ruleIndex].type} 规则: ${style.stylesheet.rules[ruleIndex].name}`)
      }
    }
  }
  
  return css.stringify(style)
}

module.exports = styleHandle