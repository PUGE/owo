"use strict"
const fs = require('fs')

// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

const tool = {
  creatDirIfNotExist: (path) => {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
    }
  },
  moveFile: (fromPath, toPath) => { // 复制文件到指定路径
    fs.readFile(fromPath, (err, fileData) => {
      if (err) throw err
      fs.writeFile(toPath, fileData, () => {
        logger.info(`copy resource: ${toPath}`)
      })
    })
  }
}
module.exports = tool