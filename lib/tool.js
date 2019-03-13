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
  },
  fnStringify: (obj) => { // 对象转字符串
    const objType = obj.constructor
    // console.log(obj)
    // console.log(objType)
    let newObj = ''
    if (objType === Array) {
      newObj += '['
    } else if (objType === Object) {
      newObj += '{'
    }
    let needRemoveCommas = false
    for (let key in obj) {
      needRemoveCommas = true
      const value = obj[key]
      
      // 前缀
      const prefix = objType === Object ? `"${key}":` : ``
      
      // 获取值类型
      if (value === null) {
        newObj += `${prefix}null,`
        continue
      }
      if (value === undefined) continue
      switch (value.constructor) {
        case Function: {
          let fnStr = JSON.stringify(obj[key] + '')
          fnStr = fnStr.substring(1, fnStr.length - 1)
          fnStr = fnStr.replace(/\\"/g, '"')
          fnStr = fnStr.replace(/\\r\\n/g, '\r\n')
          newObj += `${prefix}${fnStr},`
          break
        }
        case Array: {
          newObj +=  `${prefix}${tool.fnStringify(obj[key])},`
          break
        }
        case Object: {
          newObj +=  `${prefix}${tool.fnStringify(obj[key])},`
          break
        }
        case Number: {
          newObj += `${prefix}${obj[key]},`
          break
        }
        case Boolean: {
          // console.log(obj[key])
          newObj += `${prefix}${obj[key]},`
          break
        }
        default: {
          newObj += `${prefix}"${obj[key]}",`
        }
      }
    }
    // 去除尾部逗号,如果传入为空对象则不需要进行操作
    if (needRemoveCommas) {
      newObj = newObj.substring(0, newObj.length - 1)
    }
    if (objType === Array) {
      newObj += ']'
    } else if (objType === Object) {
      newObj += '}'
    }
    // console.log(newObj)
    return newObj
  }
}
module.exports = tool