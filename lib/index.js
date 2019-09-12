#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')

// html美化
const beautify_html = require('js-beautify').html;

// 外链警告
const AlertLink = require('./alertLink.js')
const alertLink = new AlertLink()
// 命令行运行目录
const runPath = process.cwd()

const Tool = require('./tool')
const Hrard = require('./handle/hrard')
const Script = require('./handle/script')
const Body = require('./page/body')
// 配置输出插件
const log = require('./log')()

// js预处理
const postcss      = require('postcss')
// css压缩
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')

// 字体处理
const Fontmin = require('fontmin')


// 资源文件处理
const resourceHandle = require('./resource')

const Cut = require('./cut')


class pack {
  //构造函数
  constructor(config, callBack) {
    
    // 进度显示
    this.config = config
    // 打包的版本号
    this.version = ''
    this.htmlTemple = null
    this.callBack = callBack
    this.toolList = new Set()
    this.animationList = new Set()
    this.animateList = new Set()
    // 输出目录
    this.outPutPath = path.join(runPath, this.config.outFolder)
    this.corePath = path.join(__dirname, '../core')

    // 静态资源前缀
    this.basePath = this.config.basePath || './'
    // 静态资源输出目录
    this.staticPath = path.join(this.outPutPath, 'static')
    this.callBackInfo('start', '编译开始!')
  }
  callBackInfo (type, info) {
    if (this.callBack) {
      this.callBack({type, info})
    }
  }
  // 输出页面切换动画
  outPutAnimation () {
    this.callBackInfo('animation', '正在处理动画!')
    let replaceText = ''
    // 判断动画是否为空
    // console.log(this.animationList)
    if (this.animationList.size > 0) {
      let animationData = ''
      const versionString = this.config.outPut.addVersion ? `.${this.version}` : ''
      this.animationList.forEach(animationName => {
        const animationFilePath = path.join(this.corePath, 'animation', `${animationName}.css`)
        animationData += Tool.loadFile(animationFilePath) + '\r\n'
      })
      // 输出动画样式文件
      const animationPath = path.join(this.staticPath, 'css', `owo.animation${versionString}.css`)
      Tool.creatDirIfNotExist(path.join(this.staticPath, 'css'))
      log.info(`写文件: ${animationPath}`)
      fs.writeFile(animationPath, animationData, () => {
        log.info(`文件写出成功!`)
      })
      replaceText = `<link rel="stylesheet" href="${this.basePath}static/css/owo.animation${versionString}.css">`
    }
    this.htmlTemple = this.htmlTemple.replace(`<!-- animation-output -->`, replaceText)
  }
  // 提取需要用到动画
  extractAnimate (text) {
    // 无论多页面还是单页面都需要处理动画效果
    let useAnimateList =  Cut.stringArray(text, 'owo.tool.animate(', ',')
    if (useAnimateList.length === 0) return
    // 遍历特效函数
    useAnimateList.forEach(element => {
      element = element.replace(/"/g, '')
      element = element.replace(/'/g, '')
      element = element.replace(/ /g, '')
      this.animateList.add(element)
    })
    this.toolList.add('animate')
  }
  // 输出动画效果
  outPutAnimate () {
    // console.log(this.animateList)
    this.callBackInfo('outAnimation', '正在输出动画!')
    let replaceText = ''
    // 判断“动画”集合是否为空
    if (this.config.outPut.allAnimate || this.animateList.size > 0) {
      let animationData = ''
      // 版本号
      const versionString = this.config.outPut.addVersion ? `.${this.version}` : ''
      // 判断是否设置了输出所有
      if (this.config.outPut.allAnimate) {
        const animationFilePath = path.join(this.corePath, 'animate', `animate.css`)
        animationData += Tool.loadFile(animationFilePath) + '\r\n'
      } else {
        this.animateList.forEach(animationName => {
          const animationFilePath = path.join(this.corePath, 'animate', `${animationName}.css`)
          animationData += Tool.loadFile(animationFilePath) + '\r\n'
        })
      }
      // 输出动画样式文件
      const animationPath = path.join(this.staticPath, 'css', `owo.animate${versionString}.css`)
      Tool.creatDirIfNotExist(path.join(this.staticPath, 'css'))
      log.info(`写文件: ${animationPath}`)
      fs.writeFile(animationPath, animationData, () => {
        log.info(`animation文件写出成功!`)
      })
      replaceText = `<link rel="stylesheet" href="${this.basePath}static/css/owo.animate${versionString}.css">`
    }
    this.htmlTemple = this.htmlTemple.replace(`<!-- animate-output -->`, replaceText)
  }

  // 提取需要用到插件
  outPutTool (text) {
    let returnData = '\r\n'
    // 处理使用到的方法
    let toolListTemp = Cut.stringArray(text, 'owo.tool.', '(')
    toolListTemp.forEach(element => {
      this.toolList.add(element)
    })
    this.toolList.forEach(element => {
      // console.log(element)
      returnData += Tool.loadFile(path.join(this.corePath, 'tool', `${element}.js`))
    })
    return returnData
  }
  // 单页面
  singleScriptHandle () {
    log.info('工程中只有一个页面!')
    // 单页面的话也不需要动画
    this.htmlTemple = this.htmlTemple.replace(`<!-- animation-output -->`, '')
    return Tool.loadFile(path.join(this.corePath, 'SinglePage.js'))
  }
  // 多页面
  multiScriptHandle (scriptData) {
    let coreScript = ''
    // 多页面
    log.info('工程中包含多个页面!')
    coreScript += Tool.loadFile(path.join(this.corePath, 'MultiPage.js'))
    // 多页面才可能存在切换以及切换动画
    // 页面切换特效
    // 处理使用到的特效
    let useAnimationList = Cut.stringArray(scriptData, 'owo.go(', ')')
    // console.log(coreScript)
    // 遍历特效函数
    useAnimationList.forEach(element => {
      element = element.replace(/"/g, '')
      element = element.replace(/'/g, '')
      element = element.replace(/ /g, '')
      // 1-5个参数表示动画
      const parameterList = element.split(',')
      for(let ind = 1; ind < 5; ind ++) {
        if (!parameterList[ind]) break
        const temp = parameterList[ind].split('&')
        temp.forEach(animation => {
          this.animationList.add(animation)
        })
      }
    })
    
    
    // console.log(this.animationList.size)
    // 取出js中的页面切换特效
    if (this.animationList.size > 0) {
      log.info('包含有页面切换动画!')
      log.info(`动画列表: ${Array.from(this.animationList)}`)
      coreScript += Tool.loadFile(path.join(this.corePath, 'animation.js'))
    } else {
      log.debug('页面中不包含切换动画!')
      coreScript += Tool.loadFile(path.join(this.corePath, 'noAnimation.js'))
    }
    return coreScript
  }
  // 分析并加载必要的代码
  loadCoreCode (scriptData) {
    // 读取出核心代码
    let code = Tool.loadFile(path.join(this.corePath, 'main.js'))
    if (this.config.pageList.length === 1) {
      code += this.singleScriptHandle()
    } else {
      code += this.multiScriptHandle(scriptData)
    }
    // 无论多页面还是单页面都需要处理动画效果
    this.extractAnimate(scriptData)
    
    // 加载页面就绪事件插件
    code += Tool.loadFile(path.join(this.corePath, 'whenReady.js')) + '\r\n'
    
    
    // 处理使用到的方法
    code += this.outPutTool(scriptData) + '\r\n'
    // 判断是否使用了owo.change
    if (scriptData.includes('owo.change(')) {
      log.info('包含owo.change！')
      code += Tool.loadFile(path.join(this.corePath, 'change.js'))
    }
    // 添加解决方案
    if (this.config.scheme) {
      this.config.scheme.forEach(element => {
        log.debug(`添加解决方案: ${element}`)
        code += '\r\n' + Tool.loadFile(path.join(this.corePath, 'scheme', `${element}.js`))
      })
    }
    return code
  }
  outOtherScript (changePath) {
    return new Promise((resolve, reject) => {
      if (!this.config.scriptList || this.config.scriptList.length === 0) resolve()
      log.debug(`外部脚本数量: ${this.config.scriptList.length}`)
      let temp = '\r\n'
      for (let ind = 0; ind < this.config.scriptList.length; ind++) {
        const element = this.config.scriptList[ind]
        // console.log(element)
        log.debug(`处理脚本: ${element.name}`)
        // 判断是设置了路径
        if (!element.src) {
          log.error('script path unset!', element)
          continue
        }
        // 如果是网络地址那么不需要进行处理
        if (element.src.startsWith('http')) {
          log.debug(`网络脚本: ${element.name}`)
          temp += `\r\n    <script src="${element.src}" type="text/javascript" ${element.defer ? 'defer="defer"' : ''} charset="UTF-8"></script>`
          continue
        } else {
          temp += `\r\n    <script src="${this.basePath}static/js/${element.name}.js" type="text/javascript" ${element.defer ? 'defer="defer"' : ''} charset="UTF-8"></script>`
        }
        
        // 判断是否用babel处理
        if (changePath === undefined || changePath === path.join(runPath, element.src)) {
          // 输出路径
          const outPutFile = path.join(this.staticPath, 'js', `${element.name}.js`)
          if (element.babel) {
            log.debug('使用bable处理脚本!')
            fs.readFile(path.join(runPath, element.src), 'utf8', (err, fileData) => {
              if (err) throw err
              fs.writeFile(outPutFile, Script(fileData, this.config.outPut.minifyJs).code, () => {
                log.info(`使用babel处理并生成文件: ${outPutFile}`)
              })
            })
          } else {
            Tool.moveFile(path.join(runPath, element.src), outPutFile)
          }
        }
      }
      resolve(temp)
    })
  }
  // 处理script
  handleScript (dom, changePath) {
    return new Promise((resolve, reject) => {
      log.info('正在处理script!')
      this.callBackInfo('script', '正在处理函数!')
      // 版本号后缀
      const versionString = this.config.outPut.addVersion ? `.${this.version}` : ''
      
      // 处理js中的资源
      dom.script = resourceHandle(dom.script, this.config, this.basePath + 'static/', this.staticPath)
      // 使用bable处理代码
      let mainScript = this.loadCoreCode(dom.script)
      // Script(coreScript, this.config.outPut.minifyJs).code
      // ----------------------------------------------- 输出js -----------------------------------------------
      const scriptDir = path.join(this.staticPath, 'js')
      // 判断并创建js目录
      Tool.creatDirIfNotExist(scriptDir)

      let scriptData = ''
      // 判断样式是合并到html中还是放在main.css里
      if (this.config.outPut.merge) {
        log.debug('选择将js合并到html中!')
        scriptData = `<!-- 框架script代码 --><script>${Script(dom.script).code}</script>\r\n<!-- 框架script文件 -->\r\n<script src="${this.basePath}static/js/owo.main${versionString}.js" type="text/javascript" charset="UTF-8"></script>`
        // 输出时间和框架信息
        mainScript = `// ${new Date().toString()}\r\n\r\n` + mainScript
      } else {
        scriptData = `<!-- 框架script文件 -->\r\n<script src="${this.basePath}static/js/owo.main${versionString}.js" type="text/javascript" charset="UTF-8"></script>`

        // 输出时间和框架信息
        mainScript = `// ${new Date().toString()}\r\n\r\n` + Script(dom.script).code + '\r\n\r\n' + mainScript
      }
      
      // console.log(dom.script)
      // 处理页面plug
      dom.plugList.forEach(element => {
        const filePath = path.join(__dirname, `../plug/${element}.js`)
        mainScript += '\r\n' + fs.readFileSync(filePath, 'utf8')
      })
      log.info('js中的资源处理完毕!')
      // 写出主要硬盘文件
      fs.writeFile(path.join(this.staticPath, 'js' , `owo.main${versionString}.js`), mainScript, () => {
        log.info(`主要逻辑文件写出成功!`)
      })
      // 加入框架代码
      
      // 判断是否需要加入自动刷新代码
      if (this.config.autoReload) {
        if (!changePath) {
          Tool.moveFile(path.join(this.corePath, 'debug', 'autoReload.js'), path.join(this.staticPath, 'js', `autoReload.js`))
        }
        scriptData += `\r\n<!-- 调试-热刷新代码 -->\r\n<script src="${this.basePath}static/js/autoReload.js" type="text/javascript" charset="UTF-8"></script>`
      }
      // 判断是否启用远程调试
      if (this.config.remoteDebug) {
        if (!changePath) {
          Tool.moveFile(path.join(this.corePath, 'debug', 'log.js'), path.join(this.staticPath, 'js', `log.js`))
        }
        scriptData += `\r\n<!-- 调试-远程调试 -->\r\n<script src="${this.basePath}static/js/log.js" type="text/javascript" charset="UTF-8"></script>`
      }
      log.debug(`处理引用脚本: ${JSON.stringify(this.config.scriptList)}`)
      resolve(scriptData)
    })
  }

  // 处理字体
  handleFont (fontList) {
    log.info('处理字体:', fontList)
    for (const key in fontList) {
      if (fontList.hasOwnProperty(key)) {
        const element = fontList[key]
        const fontPath = path.join(runPath, this.config.resourceFolder, key)
        // 判断字体是否存在
        if (fs.existsSync(fontPath)) {
          const fontmin = new Fontmin()
            .src(fontPath)
            .use(Fontmin.glyph({
              text: element
            }))
            .use(Fontmin.otf2ttf())
            .use(Fontmin.ttf2eot())     // eot 转换插件
            .use(Fontmin.ttf2woff())    // woff 转换插件
            .use(Fontmin.ttf2svg())     // svg 转换插件
            .dest(path.join(this.outPutPath, 'static', 'font', ''))
          fontmin.run((err, files) => {
            if (err) {
              throw err
            }
          })
        } else {
          console.error(`字体 ${fontPath} 不存在!`)
        }
      }
    }
    
  }
  // 输出外部style文件
  outOtherStyle (changePath) {
    return new Promise((resolve, reject) => {
      const styleList = this.config.styleList
      if (!styleList || styleList.length === 0) resolve('')
      let otherStyleText = ''
      // 检查并创建目录
      Tool.creatDirIfNotExist(path.join(this.staticPath, 'css'))
      otherStyleText += `\r\n    <!-- 附属css文件 -->`
      // 遍历外部引用列表
      for (let ind = 0; ind < styleList.length; ind++) {
        const element = styleList[ind]
        // 判断是设置了路径
        if (!element.src) {
          console.error('style path unset!', element)
          continue
        }
        // 如果是网络地址那么不需要进行处理
        if (element.src.startsWith('http')) {
          otherStyleText += `\r\n    <link rel="stylesheet" href="${element.src}" charset="utf-8">`
          continue
        } else {
          otherStyleText += `\r\n    <link rel="stylesheet" href="${this.basePath}static/css/${element.name}.css" charset="utf-8">`
        }
        // 输出路径
        const outPutFile = path.join(this.staticPath, 'css', `${element.name}.css`)
        const fromPath = path.join(runPath, element.src)
        if (changePath === undefined || changePath === fromPath) {
          // 判断是否需要处理资源
          if (element.resource) {
            // 处理资源并移动
            log.info('开始处理附属css中的资源')
            fs.readFile(fromPath, (err, fileData) => {
              log.info(`读取成功: ${fromPath}`)
              if (err) throw err
              fileData = resourceHandle(fileData.toString(), this.config, '../', this.staticPath)
              // console.log(fileData)
              fs.writeFile(outPutFile, fileData, () => {
                log.info(`写入文件: ${outPutFile}`)
              })
            })
            log.info('附属css中的资源处理完毕!')
          } else {
            // 不需要处理则直接移动就可以了
            Tool.moveFile(fromPath, outPutFile)
            log.info('附属css中的资源不需要处理!')
          }
          
        }
      }
      
      resolve(otherStyleText)
    })
  }
  // 处理style
  handleStyle(dom) {
    return new Promise((resolve, reject) => {
      this.callBackInfo('style', '正在处理样式!')
      const versionString = this.config.outPut.addVersion ? `.${this.version}` : ''
      let styleData = ''
      // 添加入框架内置样式
      const mainStyle = path.join(this.corePath, `main.css`)
      let outPutCss = Tool.loadFile(mainStyle) + `\r\n` + dom.style
      // --------------------------------- 动画效果 ---------------------------------------------
      dom.useAnimationList.forEach(element => {
        this.animationList.add(element)
      })
      
      // 判断是否设置了资源文件夹
      if (this.config.resourceFolder) {
        outPutCss = resourceHandle(outPutCss, this.config, this.config.outPut.merge? this.basePath + 'static/' : '../', this.staticPath)
        log.debug('css中的资源处理完毕!')
      }
      
      // ----------------------------------------------- 使用postcss处理 -----------------------------------------------
      // 自动加浏览器前缀
      // console.log(autoprefixer.process)
      let plugList = [autoprefixer]
      // 判断是否压缩优化css
      if (this.config.outPut.minifyCss) {
        plugList.push(cssnano)
      }
      
      log.debug(`使用postcss处理样式，使用了${plugList.length}个插件!`)
      const postStartTime = new Date().getTime()
      
      postcss(plugList).process(outPutCss, { from: undefined, cascade: true }).then( (result) => {
        // console.log(result)
        
        log.info(`使用postcss处理完毕! 用时: ${new Date().getTime() - postStartTime} 毫秒`)
        result.warnings().forEach((warn) => {
          console.warn(warn.toString())
        })
        // console.log('css处理完毕!')
        dom.style = result.css
        // 处理需要经过特殊处理的css文件
        log.debug('需要经过特殊处理的css: ', dom.needReplaceCssList)
        dom.needReplaceCssList.forEach(element => {
          dom.style = Tool.replaceAll(dom.style, element[0], element[1])
        })

        // 判断是否需要提示外链信息
        if (this.config.alertLink) {
          log.info('判断css中的外链情况!')
          alertLink.add(dom.style)
        }
        // ----------------------------------------------- 输出css -----------------------------------------------
        // 判断样式是合并到html中还是放在main.css里
        if (this.config.outPut.merge) {
          styleData += `<!-- 页面主样式文件 -->\r\n<style>\r\n${dom.style}\r\n</style>`
        } else {
          // 写出样式文件
          Tool.creatDirIfNotExist(path.join(this.staticPath, 'css'))
          const outPutFile = path.join(this.staticPath, 'css', `owo.main${versionString}.css`)
          fs.writeFile(outPutFile, dom.style, () => {
            log.info(`写入文件: ${outPutFile}`)
          })
          
          styleData += `<!-- 页面主样式文件 -->\r\n<link charset="utf-8"  rel="stylesheet" href="${this.basePath}static/css/owo.main${versionString}.css">`
        }
        resolve(styleData)
      })
    })
  }

  outPutHtml () {
    this.callBackInfo('outPutHtml', '正在输出Html!')
    log.debug('准备输出html!')
    // 对html所引用的资源进行处理
    this.htmlTemple = resourceHandle(this.htmlTemple, this.config, this.basePath + 'static/', this.staticPath)
    // 如果是debug模式那么不需要进行优化
    if (!this.config.debug) {
      // 美化html
      log.debug('开始美化html')
      this.htmlTemple = beautify_html(this.htmlTemple, {
        indent_size: 2,
        inline: [
          "abbr", "area", "b", "bdi", "bdo", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "dfn", "em", "i", "iframe", "input", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript", "object", "output", "progress", "q", "ruby", "s", "samp", "select", "small", "strong", "sub", "sup", "svg", "template", "textarea", "time", "u", "var", "wbr", "text", "acronym", "address", "big", "dt", "ins", "strike", "tt"
        ],
        space_in_empty_paren: false
      })
      // 判断是否需要提示外链信息
      if (this.config.alertLink) {
        log.info('判断html中的外链情况!')
        alertLink.add(this.htmlTemple)
      }
    }
    
    // 写出文件
    fs.writeFileSync(path.join(this.outPutPath, 'index.html'), this.htmlTemple)
  }

  setConfig (config) {
    this.config = config
  }

  // 执行默认打包任务
  pack(changePath) {
    console.log(this.config.title)
    log.info(`--------------------------- 开始编译 ---------------------------`)
    // 输出运行目录
    log.info(`程序运行目录: ${runPath}`)
    
    // 判断是否为更新
    if (!changePath) {
      log.info(`首次启动!`)
      // 生成版本号
      this.version = Math.random().toString(36).substr(2)
      log.info(`生成版本号: ${this.version}`)
      // 清空静态文件目录
      if (fs.existsSync(this.staticPath)) {
        Tool.delDir(this.staticPath)
        log.info(`清理资源文件夹: ${this.staticPath}`)
      }
      // 创建目录
      Tool.creatDirIfNotExist(this.outPutPath)
      Tool.creatDirIfNotExist(this.staticPath)
    } else {
      log.info(`刷新模式,变化目录: ${changePath}`)
    }

    // 读取入口模板文件(一次性读取到内存中)
    const templeFile = path.join(__dirname, 'index.html')
    log.info(`读取模板文件: ${templeFile}`)
    this.htmlTemple = fs.readFileSync(templeFile, 'utf8')

    // 处理title
    log.debug(`读取网页标题: ${this.config.title}`)
    this.htmlTemple = this.htmlTemple.replace('{{title}}', this.config.title || 'owo')

    log.debug(`处理页面源信息: ${JSON.stringify(this.config.headList)}`)

    this.htmlTemple = Hrard(this.config.headList, this.htmlTemple)

    const dom = Body(this.htmlTemple, this.config)
    this.htmlTemple = dom.html
    // 处理Html中的动画方法
    this.extractAnimate(dom.html)
    
    // 处理内部style和外部引用style
    Promise.all([this.handleStyle(dom), this.outOtherStyle(changePath)]).then(styleData => {
      this.htmlTemple = this.htmlTemple.replace(`<!-- css-output -->`, styleData[0] + styleData[1])
      
      // 处理script
      Promise.all([this.handleScript(dom, changePath), this.outOtherScript(changePath)]).then(scriptData => {
        log.debug('输出scriptData')
        this.htmlTemple = this.htmlTemple.replace(`<!-- script-output -->`, scriptData[0] + scriptData[1])
        this.outPutAnimation()
        // 输出效果
        this.outPutAnimate()
        this.outPutHtml()
        // 判断是否需要提示外链信息
        if (this.config.alertLink) {
          log.info('显示外链情况!')
          alertLink.show()
        }
        this.callBackInfo('end', '编译结束!')
      })
    })
    // 处理字体
    this.handleFont(dom.fontList)
  }
}

module.exports = pack