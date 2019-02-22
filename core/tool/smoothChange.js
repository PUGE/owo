/**
 * 平滑的改变值
 * @param  {number} startValue 初始数值
 * @param  {number} endValue   结束数值
 * @param  {number} time       持续次数
 * @param  {number} step       步长
 * @param  {function} callBack 回调函数
 * @return {object}            控制信息
 */

ozzx.tool.smoothChange = (startValue, endValue, time, step, callBack) => {
  if (isNaN(startValue)) {
    console.error(`startValue的值不能为NaN`)
    return
  }
  if (isNaN(endValue)) {
    console.error(`endValue的值不能为NaN`)
    return
  }
  if (isNaN(time)) {
    console.error(`time的值不能为NaN`)
    return
  }

  // 控制器
  const control = {
    next: true
  }

  // 计算次数  距离 / 步长
  let num = (endValue - startValue) / step
  // console.log(`次数:${num}`)
  // 计算间隔 时间 / 次数
  const interval = time / num
  // console.log(`间隔:${interval}`)
  
  let frequency = 0
  function loop() {
    setTimeout(() => {
      callBack(startValue + frequency * step)
      if (++frequency <= num && control.next) {
        loop()
      }
    }, interval * 1000)
  }
  loop()
  return control
}