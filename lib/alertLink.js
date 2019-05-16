const Tool = require('./tool')

class alertLink {
  constructor() {
    // 进度显示
    this.linkList = []
  }
  add (text) {
    const urlList = Tool.cutStringArray(text, 'url(', ')')
    urlList.forEach(element => {
      if (element.startsWith('http')) {
        const host = Tool.cutString(element, '//', '/')
        if (!this.linkList.includes(host)) {
          this.linkList.push(host)
        }
      }
    })
  }
  show () {
    console.log(this.linkList)
  }
  clear () {
    this.linkList = []
  }
}

module.exports = alertLink