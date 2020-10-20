"use strict"
const fs = require('fs')

// 配置输出插件
const log = require('./log')

const tool = {
  creatDirIfNotExist: (path) => {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
      log.debug(`创建不存在的目录目录: ${path}`)
    }
  },
  moveFile: (fromPath, toPath) => { // 复制文件到指定路径
    log.debug(`读取文件: ${fromPath}`)
    fs.readFile(fromPath, (err, fileData) => {
      log.debug(`读取成功: ${fromPath}`)
      if (err) throw err
      fs.writeFile(toPath, fileData, () => {
        log.debug(`写入文件: ${toPath}`)
      })
    })
  },
  // 删除文件夹所有内容
  delDir: (path) => {
    let files = [];
    if(path && fs.existsSync(path)) {
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
        let curPath = path + "/" + file;
        if (fs.statSync(curPath).isDirectory()){
          tool.delDir(curPath); //递归删除文件夹
        } else {
          fs.unlinkSync(curPath); //删除文件
        }
      })
      fs.rmdirSync(path, {
        maxRetries: 10
      })
    }
  },
  // 读取指定目录文件
  loadFile: (path) => {
    if (fs.existsSync(path)) {
      return fs.readFileSync(path, 'utf8')
    } else {
      log.error(`file does not exist: ${path}`)
      return ''
    }
  },
  fnStringify: (obj) => { // 对象转字符串
    const objType = obj.constructor
    // console.log(obj)
    let newObj = ''
    if (objType === Array) {
      newObj += '['
    } else if (objType === Object) {
      newObj += '{'
    }
    let needRemoveCommas = false
    for (let key in obj) {
      
      const value = obj[key]
      
      // 前缀
      const prefix = objType === Object ? `"${key}":` : ``
      
      // 获取值类型
      if (value === null) {
        newObj += `${prefix}null,`
        continue
      }
      if (value === undefined) continue
      needRemoveCommas = true
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
          // 转义双引号
          obj[key] = obj[key].replace(/"/g, '\\"')
          obj[key] = obj[key].replace(/\r/g, '')
          obj[key] = obj[key].replace(/\n/g, '')
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
  },
  /**
   * 字符串替换
   * @param  {string} str    要被替换的字符串
   * @param  {string} substr 要替换的字符串
   * @param  {string} newstr 用于替换的字符串
   * @return {string}        替换后的新字符串
   */
  replaceAll: (str, substr, newstr) => {
    substr = substr.replace(/[.\\[\]{}()|^$?*+]/g, "\\$&")
    const re = new RegExp(substr, "g")
    return str.replace(re, newstr)
  },
  cutString: function (original, before, after, index) {
    index = index || 0
    if (typeof index === "number") {
      const P = original.indexOf(before, index)
      // console.log(P, index)
      if (P > -1) {
        if (after) {const f = original.indexOf(after, P + before.length)
          // console.log(original.slice(P + before.toString().length, f))
          return (f>-1)? original.slice(P + before.toString().length, f) : ''
        } else {
          return original.slice(P + before.toString().length);
        }
      } else {
        return null
      }
    } else {
      console.error("owo [sizeTransition:" + index + "不是一个整数!]")
    }
  },
  cutStringArray: function (original, before, after, index, inline) {
    if (!original) {
      console.error('原始字段为空!')
      return []
    }
    let aa=[], ab=0;
    index = index || 0
    
    while(original.indexOf(before, index) >= 0) {
      const temp = this.cutString(original, before, after, index)
      if (temp !== null) {
        if (inline) {
          if (temp.indexOf('\n') === -1) {
            aa[ab] = temp
            ab++
          }
        } else {
          aa[ab] = temp
          ab++
        }
      }
      // console.log(before)
      index = original.indexOf(before, index) + 1
    }
    return aa;
  },
  getValFromObj: (str, obj) => {
    let value = obj
    // 如果模块没有数据则直接返回null
    if (!value) return null
    const arr = str.split('.')
    for (let index = 0; index < arr.length; index++) {
      const element = arr[index]
      if (value[element]) {
        value = value[element]
      } else {
        return ''
      }
    }
    return value
  }
}
module.exports = tool