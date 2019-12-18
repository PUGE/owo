/**
 * 遍历对象
 * @return {object} 屏幕信息
 */

owo.tool.each = function (obj, fn) {
  for (var ind = 0; ind < obj.length; ind++) {
    fn(obj[ind], ind)
  }
}