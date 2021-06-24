'use strict'
import fs from 'fs'
import css from 'css'
import Tool from '../tool/tool.js'
// 配置输出插件
import log from '../tool/log.js'

import lessRender from 'less'

function styleHandle (htmlText, boxClassList, tagName, useOriginal) {
  let styleData = ''
  // 是否需要预处理css
  const styleLabelList = Tool.cutStringArray(htmlText, "<style", ">")
  // console.log(styleLabelList)
  // 截取出CSS字符串
  const styleTextList = []
  styleLabelList.forEach(element => {
    styleTextList.push(Tool.cutString(htmlText, `<style${element}>`, `</style>`))
  });
  for (let index = 0; index < styleLabelList.length; index++) {
    const styleLabel = styleLabelList[index];
    let styleText = styleTextList[index]
    
    if (!styleText) {
      console.error(`style标签内容为空!`)
      break
    }
    // 处理每一个样式标签
    const lang = Tool.cutString(styleLabel, 'lang="', '"')

    
    // console.log(styleText)
    // 如果设置需要使用预处理插件处理则使用对应的插件
    if (lang === "less") {
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
    } else {
      log.debug('原样输出样式!')
    }
    styleData += css.stringify(style)
  }
  
  return styleData
}

export default styleHandle