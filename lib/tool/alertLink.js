const Tool = require('./tool')
// 配置输出插件
const log = require('./log')()

class alertLink {
  constructor() {
    // 进度显示
    this.linkList = []
  }
  add (text) {
    let urlList = []
    urlList = urlList.concat(Tool.cutStringArray(text, 'href="', '"'))
    urlList = urlList.concat(Tool.cutStringArray(text, 'url(', ')'))
    urlList = urlList.concat(Tool.cutStringArray(text, 'src="', '"'))
    log.debug(`发现外链列表: ${urlList}`)
    urlList.forEach(element => {
      element = element.replace(/"/g, '')
      if (element.startsWith('http')) {
        const host = Tool.cutString(element, '//', '/')
        if (!this.linkList.includes(host)) {
          this.linkList.push(host)
        }
      }
    })
  }
  show () {
    if (this.linkList.length === 0) {
      console.log('项目中不存在外部链接!')
      return
    }
    console.log('---------- 项目中存在外部链接 ----------')
    this.linkList.forEach(element => {
      console.log(element)
    })
    console.log('----------------------------------------')
  }
  clear () {
    this.linkList = []
  }
}

module.exports = alertLink