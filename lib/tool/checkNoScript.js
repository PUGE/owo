function checkNoScript (obj) {
  let returnData = true
  function checkObj (objData) {
    for (const key in objData) {
      if (objData.hasOwnProperty(key)) {
        const element = objData[key];
        switch (typeof element) {
          case 'object': {
            checkObj(element)
            break
          }
          case 'undefined': {
            break
          }
          default: {
            if (!key.startsWith('_')) returnData = false
          }
        }
        
      }
    }
  }
  checkObj(obj)
  return returnData
}

export default checkNoScript