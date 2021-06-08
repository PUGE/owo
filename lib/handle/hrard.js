
// 处理heard
function handleHrard(config, htmlTemple) {
  const headList = config.headList
  // 取出所有Heard标识
  let heardData = `<!-- 页面的元信息 -->\r\n    <title>${config.title || 'owo'}</title>`
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
}

export default handleHrard