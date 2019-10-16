
// 清理使用不到的数据
function clearNoUse (scriptData) {
  for (const templateKey in scriptData) {
    if (scriptData.hasOwnProperty(templateKey)) {
      const templateValue = scriptData[templateKey]
      if (templateValue.data) {
        for (const dataKey in templateValue.data) {
          if (templateValue.data.hasOwnProperty(dataKey)) {
            if (dataKey.startsWith('_')) {
              delete scriptData[templateKey].data[dataKey]
            }
          }
        }
      }
      if (templateValue.prop) {
        for (const propKey in templateValue.prop) {
          if (templateValue.prop.hasOwnProperty(propKey)) {
            if (propKey.startsWith(':') || propKey.startsWith('_')) {
              delete scriptData[templateKey].prop[propKey]
            }
          }
        }
      }
      if (templateValue.template) {
        // 递归处理子模块
        clearNoUse(templateValue.template)
      }
    }
  }
}

module.exports = clearNoUse