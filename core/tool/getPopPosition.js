/**
 * 智能计算弹窗合适出现的位置
 * @param  {number} areaW 区域的宽度
 * @param  {number} areaH 区域的高度
 * @param  {number} boxW  弹窗的高度
 * @param  {number} boxH  弹窗的高度
 * @param  {number} x     出现点的X轴坐标
 * @param  {number} y     出现点的Y轴坐标
 * @return {object} 返回合适的位置信息
 */

owo.tool.getPopPosition = (areaW, areaH, boxW, boxH, x, y) => {
  let left, top
  // 先判断横坐标
  // 距离右侧区域
  if((areaW - x) > boxW) {
    left = x
  } else {
    left = x - boxW
  }
  // 判断纵坐标
  if((areaH - y) > boxH) {
    top = y
  } else {
    top = y - boxH
  }
  return {left, top}
}