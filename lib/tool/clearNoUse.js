
// 清理使用不到的数据
function clearNoUse (scriptData) {
  // 遍历代码
  for (const templateKey in scriptData) {
    if (scriptData.hasOwnProperty(templateKey)) {
      const templateValue = scriptData[templateKey]
      // 清除type
      delete scriptData[templateKey].moduleType
      if (!templateValue) break
      // 处理data
      if (templateValue.data && typeof templateValue.data === 'object') {
        for (const dataKey in templateValue.data) {
          if (templateValue.data.hasOwnProperty(dataKey)) {
            if (dataKey.startsWith('_')) {
              delete scriptData[templateKey].data[dataKey]
            }
          }
        }
        if (Object.keys(templateValue.data).length == 0) delete scriptData[templateKey].data
      }
      if (templateValue.prop) {
        for (const propKey in templateValue.prop) {
          if (templateValue.prop.hasOwnProperty(propKey)) {
            if (propKey.startsWith(':') || propKey.startsWith('_') || propKey.startsWith('o-') ||  propKey === 'name' || propKey === 'src' || propKey === 'class') {
              delete scriptData[templateKey].prop[propKey]
            }
          }
        }
        if (Object.keys(templateValue.prop).length == 0) delete scriptData[templateKey].prop
      }
      // 清理空的created方法
      if (templateValue.created) {
        if (templateValue.created.toString().replace(/ /g, '').replace(/\n/g, '').replace(/\r/g, '') === 'function(){}'){
          delete scriptData[templateKey].created
        }
      }
      if (templateValue.template) {
        // 递归处理子模块
        clearNoUse(templateValue.template)
      }
      if (templateValue.view) {
        // 递归处理子模块
        for (const key in templateValue.view) {
          const element = templateValue.view[key];
          clearNoUse(element)
        }
      }
      if (Object.keys(scriptData[templateKey]).length == 0) delete scriptData[templateKey]
    }
  }
  return scriptData
}

module.exports = clearNoUse