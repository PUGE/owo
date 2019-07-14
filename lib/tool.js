"use strict"
const fs = require('fs')

// 配置输出插件
const log = require('./log')()

const tool = {
  creatDirIfNotExist: (path) => {
    if (!fs.existsSync(path)) {
      log.info(`文件夹不存在: ${path}`)
      fs.mkdirSync(path)
      log.info(`创建文件夹: ${path}`)
    }
  },
  moveFile: (fromPath, toPath) => { // 复制文件到指定路径
    log.info(`读取文件: ${fromPath}`)
    fs.readFile(fromPath, (err, fileData) => {
      log.info(`读取成功: ${fromPath}`)
      if (err) throw err
      fs.writeFile(toPath, fileData, () => {
        log.info(`写入文件: ${toPath}`)
      })
    })
  },
  // 删除文件夹所有内容
  delDir: (path) => {
    let files = [];
    if(fs.existsSync(path)) {
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
  cutString: (original, before, after, index) => {
    index = index || 0;
    if (typeof index === "number") {
      const P = original.indexOf(before, index);
      if (P > -1) {
        if (after) {
          const f = original.indexOf(after, P + before.length);
          return (f>-1) ? original.slice(P + before.toString().length, f) : console.error("owo [在文本中找不到 参数三 "+after+"]");
        } else {
          return original.slice(P + before.toString().length);
        }
      } else {
        // console.error("owo [在文本中找不到 参数一 " + before + "]");
        return null
      }
    } else {
      console.error("owo [sizeTransition:" + index + "不是一个整数!]");
    }
  },
  cutStringArray: (original, before, after, index) => {
    var aa=[], ab=0;
    while(original.indexOf(before,index) > 0) {
      aa[ab] = tool.cutString(original, before, after, index)
      index=original.indexOf(before, index) + 1
      ab++
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
        return value[element]
      }
    }
    return value
  }
}
module.exports = tool