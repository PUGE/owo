'use strict'

module.exports = {
  logList: [],
  debugNum: 0,
  errorNum: 0,
  infoNum: 0,
  warningNum: 0,
  debug: function (text) {
    this.logList.push({
      type: 'debug',
      text: text
    })
    this.debugNum++
  },
  error: function (text) {
    this.logList.push({
      type: 'error',
      text: text
    })
    this.errorNum++
  },
  warning: function (text) {
    this.logList.push({
      type: 'warning',
      text: text
    })
    this.warningNum++
  },
  info: function (text) {
    this.logList.push({
      type: 'info',
      text: text
    })
    this.infoNum++
  }
}