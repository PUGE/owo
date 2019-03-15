/**
 * 获取URL参数中字段的值
 * @param  {string} name 参数名称
 * @return {string} 返回参数值
 */

ozzx.tool.getQueryString = (name) => {
  const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i")
  const r = window.location.search.substr(1).match(reg)
  if (r != null) return unescape(r[2])
  return null
}