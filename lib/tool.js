"use strict"
const fs = require('fs')

// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger('tool.js')

const tool = {
  creatDirIfNotExist: (path) => {
    if (!fs.existsSync(path)) {
      logger.info(`文件夹不存在: ${path}`)
      fs.mkdirSync(path)
      logger.info(`创建文件夹: ${path}`)
    }
  },
  moveFile: (fromPath, toPath) => { // 复制文件到指定路径
    logger.info(`读取文件: ${fromPath}`)
    fs.readFile(fromPath, (err, fileData) => {
      logger.info(`读取成功: ${fromPath}`)
      if (err) throw err
      fs.writeFile(toPath, fileData, () => {
        logger.info(`写入文件: ${toPath}`)
      })
    })
  },
  // 删除文件夹所有内容
  delDir: (path) => {
    let files = [];
    if(fs.existsSync(path)){
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
        let curPath = path + "/" + file;
        if(fs.statSync(curPath).isDirectory()){
          tool.delDir(curPath); //递归删除文件夹
        } else {
          fs.unlinkSync(curPath); //删除文件
        }
      })
      fs.rmdirSync(path)
    }
  },
  // 读取指定目录文件
  loadFile: (path) => {
    if (fs.existsSync(path)) {
      return fs.readFileSync(path, 'utf8')
    } else {
      logger.error(`file does not exist: ${path}`)
      return ''
    }
  }
}
module.exports = tool