
// 处理heard
function handleHrard(headList, htmlTemple) {
  // 取出所有Heard标识
  let heardData = '<!-- 页面的元信息 -->'
  headList.forEach(element => {
    let heard = `\r\n    <meta`
    for (const key in element) {
      const value = element[key]
      heard += ` ${key}="${value}"`
    }
    heard += `/>`
    heardData += `${heard}`
  })
  htmlTemple = htmlTemple.replace(`<!-- *head* -->`, heardData)
  return htmlTemple
  outPutHtml()
}

module.exports = handleHrard