'use strict'
const Cut = require('../../cut')
const Tool = require('../../tool')

// 解析v-for
function parseFor (exp) {
  const stripParensRE = /^\(|\)$/g
  const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
  const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
  var inMatch = exp.match(forAliasRE)
  if (!inMatch) { return }
  var res = {};
  res.for = inMatch[2].trim();
  var alias = inMatch[1].trim().replace(stripParensRE, '');
  var iteratorMatch = alias.match(forIteratorRE);
  if (iteratorMatch) {
    res.alias = alias.replace(forIteratorRE, '').trim();
    res.iterator1 = iteratorMatch[1].trim();
    if (iteratorMatch[2]) {
      res.iterator2 = iteratorMatch[2].trim();
    }
  } else {
    res.alias = alias;
  }
  return res
}

// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
function getAndRemoveAttr (el, name) {
  const value = el.attributes.getNamedItem(name).value
  el.attributes.removeNamedItem(name)
  return value
}



// 处理v-for
function handleFor (dom, scriptData) {
  const attributeValue = getAndRemoveAttr(dom, '@for')
  
  const loopInfo = parseFor(attributeValue)
  // console.log(dom.outerHTML)
  let newHtml = ''
  // console.log(parseFor(attributeValue))
  
  const replaceList = Cut.stringArray(dom.outerHTML, '{{', '}}')
  // 判断是否为循环数字
  if (/^[0-9]+$/.test(loopInfo["for"])) {
    for (let i = 0; i < parseInt(loopInfo["for"]); i++) {
      let temple = dom.outerHTML
      for (let replaceInd = 0; replaceInd < replaceList.length; replaceInd++) {
        temple = temple.replace(`{{${loopInfo['alias']}}}`, i)
      }
      newHtml += temple
    }
  } else {
    let index = 0
    for (let key in scriptData[loopInfo["for"]]) {
      const value = scriptData[loopInfo["for"]][key]
      let copyTemple = dom.outerHTML
      for (let replaceInd = 0; replaceInd < replaceList.length; replaceInd++) {
        
        const replaceValue = replaceList[replaceInd]
        
        if (!replaceValue) continue
        if (loopInfo.iterator1 === replaceValue) {
          copyTemple = copyTemple.replace(`{{${replaceValue}}}`, key)
        } else if (loopInfo.iterator2 === replaceValue) {
          copyTemple = copyTemple.replace(`{{${replaceValue}}}`, index)
        } else {
          const newValue = new Function(`const ${loopInfo.alias} = ${Tool.fnStringify(value)}; return ${replaceValue}`)()
          copyTemple = copyTemple.replace(`{{${replaceValue}}}`, newValue)
        }
      }
      newHtml += copyTemple
      index++
    }
  }
  return newHtml
}

module.exports = handleFor