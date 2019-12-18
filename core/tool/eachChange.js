/**
 * 遍历对象
 * @return {object} 屏幕信息
 */

owo.tool.eachChange = function (obj, path, value) {
  // 遍历第一层取出所有对象
  for (var ind = 0; ind < obj.length; ind++) {
    var temp = obj[ind]
    // 遍历第二层取出所有路径
    for (var pathInd = 0; pathInd < path.length; pathInd++) {
      var key = path[pathInd]
      if (temp[key] !== undefined) {
        if (pathInd == path.length - 1) {
          temp[key] = value
        } else {
          temp = temp[key]
        }
      }
    }
  }
}