"use strict"
import fs from 'fs'
import path from 'path'
import AlertLink from './tool/alertLink.js'
const alertLink = new AlertLink()
import handleLink from './tool/handleLink.js'
// 配置输出插件
import log from './tool/log.js'
// html美化
import beautify_html from 'js-beautify';
import clearNoUse from './tool/clearNoUse.js'
// 资源文件处理
import Resource from './resource.js'
let resource = new Resource()
import Script  from './handle/script.js'
import Storage from './storage.js'
// js预处理
import postcss from 'postcss'

import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import lessRender from 'less'
import pug from 'pug'

// 处理heard
const register = {
  clear: function () {
    resource = new Resource()
  },
  // 获取到模块Script
  handleTemplateScript: function (data) {
    return data
  },
  HandleScriptEnd: function (data) {
    // 清理数据
    data = clearNoUse(data)
    return data
  },
  outPutHtml: function (data, config) {
    const basePath = config.basePath || './'
    // 对html所引用的资源进行处理
    data = resource.handle(data, config, basePath + 'static/')
    if (!config.debug) {
      // 美化html
      log.debug('开始美化html')
      data = beautify_html.html(data, {
        indent_size: 2,
        inline: [
          "abbr", "area", "b", "bdi", "bdo", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "dfn", "em", "i", "iframe", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript", "object", "output", "progress", "q", "ruby", "s", "samp", "small", "strong", "sub", "sup", "svg", "template", "time", "u", "var", "wbr", "text", "acronym", "address", "big", "dt", "ins", "strike", "tt"
        ],
        space_in_empty_paren: false
      })

    }
    // 判断是否需要提示外链信息
    if (config.alertLink) {
      log.info('判断html中的外链情况!')
      alertLink.add(data)
    }
    // 判断是否需要处理外链信息
    if (config.handleLink) {
      const outPutPath = path.join(process.cwd(), config.outFolder)
      log.info('判断html中的外链情况!')
      
      data = handleLink(data, outPutPath + '/static/resource/', './static/resource/')
    }
    return data
  },
  outPutStyle: function (data, config) {
    const basePath = config.basePath || './'
    // 对html所引用的资源进行处理
    data = resource.handle(data, config, basePath + 'static/')
    // 判断是否需要提示外链信息
    if (config.alertLink) {
      log.info('判断html中的外链情况!')
      alertLink.add(data)
    }
    // 判断是否需要处理外链信息
    if (config.handleLink) {
      const outPutPath = path.join(process.cwd(), config.outFolder)
      log.info('判断html中的外链情况!')
      data = handleLink(data, outPutPath + '/static/resource/', '../resource/')
    }
    return data
  },
  packFinish: function (config) {
    // 判断是否需要提示外链信息
    if (config.alertLink) {
      log.info('显示外链情况!')
      alertLink.show()
    }
  },
  downloadTemplate: function (data) {
    return data
  },
  JSData: function (data, config) {
    const basePath = config.basePath || './'
    data = resource.handle(data, config, basePath + 'static/')
    return data
  },
  CSSData: function (data, config) {
    return new Promise((resolve, reject) => {
      // 判断是否设置了资源文件夹
      if (config.resourceFolder) {
        log.debug('开始处理css中的资源!')
        const cssResourceStartTime = new Date().getTime()
        data = resource.handle(data, config, '../')
        log.debug(`css中的资源处理完毕! 用时: ${new Date().getTime() - cssResourceStartTime} 毫秒`)
      }
      // ----------------------------------------------- 使用postcss处理 -----------------------------------------------
      // 自动加浏览器前缀
      // console.log(autoprefixer.process)
      let postPlugList = [autoprefixer]
      // 判断是否压缩优化css
      if (config.minifyCss) {
        postPlugList.push(cssnano({preset: 'default'}))
      }
      
      log.debug(`使用postcss处理样式，使用了${postPlugList.length}个插件!`)
      const postStartTime = new Date().getTime()
      postcss(postPlugList).process(data, { from: undefined}).then((result) => {
        
        // console.log(result)
        log.info(`使用postcss处理完毕! 用时: ${new Date().getTime() - postStartTime} 毫秒`)
        result.warnings().forEach((warn) => {
          console.warn(warn.toString())
        })
        resolve(result.css)
      })
    })
  },
  otherJSFile: function (fileData, setting, config) {
    if (setting.babel) {
      fileData = Script(fileData, config.minifyJs).code
    }
    
    if (setting.resource) {
      fileData = resource.handle(fileData, config, '../')
    }
    
    return fileData
  },
  otherCSSFile: function (setting, config) {
    const outPutFile = path.join(process.cwd(), config.outFolder, 'static', 'css', `${setting.name}.css`)
    fs.readFile(path.join(process.cwd(), setting.src), (err, fileData) => {
      if (setting.resource) {
        fileData = resource.handle(fileData.toString(), config, '../')
      }
      // 判断是否经过less处理
      if (setting.less) {
        lessRender.render(fileData, (e, output) => {
          if (e) throw Error(e)
          else fileData = output.css
        })
      }
      fs.writeFile(outPutFile, fileData, () => {
        log.info(`写入文件: ${outPutFile}`)
      })
    })
  },
  // 读取到owo文件
  readTemplate: function (templateData, lang) {
    if (lang) {
      switch (lang) {
        case 'pug': {
          const pugRender = pug
          templateData = pugRender.compile(templateData, {
            self: true, // 使用一个叫做 self 的命名空间来存放局部变量。这可以加速编译的过程，但是，相对于原来书写比如 variable 来访问局部变量，您将需要改为 self.variable 来访问它们。
          })()
          break
        }
        default: {
          console.error(`不支持的语言类型: ${lang}`)
        }
      }
    }
    return templateData
  },
  fileChange: function (changePath, owo) {
    const watcherFileItem = Storage.watcherFile[changePath]
    if (watcherFileItem) {
      // 快速处理变更的资源文件
      if (watcherFileItem.type === 'resource') {
        resource.miniImg([changePath], path.join(owo.staticPath, 'resource'))
        log.info('编译结束!')
        owo.callBackInfo('end', '编译结束!')
        return
      } else if (watcherFileItem.type === 'css') {
        register.otherCSSFile(watcherFileItem, owo.config)
        log.info('编译结束!')
        owo.callBackInfo('end', '编译结束!')
        return
      } else if (watcherFileItem.type === 'js' && !watcherFileItem.merge) {
        let fileData = fs.readFileSync(path.join(process.cwd(), watcherFileItem.src), 'utf8')
        // 插件做处理
        fileData = register.otherJSFile(fileData, watcherFileItem, owo.config)
        // 输出路径
        const outPutFile = path.join(owo.staticPath, 'js', `${watcherFileItem.name}.js`)
        fs.writeFile(outPutFile, fileData, (e) => {
          if (e) throw e
          log.debug(`处理文件: ${outPutFile}`)
        })
        log.info('编译结束!')
        owo.callBackInfo('end', '编译结束!')
        return
      }
    }
  }
}

export default register