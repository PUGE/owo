// 清理无用的代码
function clearScript (scriptData) {
  let newScriptData = {}
  console.log(scriptData)
  for (const key in scriptData) {
    if (scriptData.hasOwnProperty(key)) {
      const element = scriptData[key]
      // console.log(element)
      switch (typeof element) {
        case 'object': {
          
          const objString = JSON.stringify(element)
          if (objString !== "{}" && objString !== '[]') {
            newScriptData[key] = element
          }
          break
        }
        default: {
          newScriptData[key] = element
        }
      }
      
    }
  }
  return newScriptData
}
module.exports = clearScript