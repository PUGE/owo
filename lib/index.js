#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
const ora = require('ora')

// html美化
const beautify_html = require('js-beautify').html;

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
const precss = require('precss')
// css压缩
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')


// 资源文件处理
const resourceHandle = require('./resource')

const Cut = require('./cut')
const spinner = ora('开启打包进程').start()

class pack {
  //构造函数
  constructor(config, callBack) {
    // 进度显示
    this.config = config
    // 打包的版本号
    this.version = ''
    this.startTime = null
    this.htmlTemple = null
    this.callBack = callBack
    this.animationList = new Set()
    // 输出目录
    this.outPutPath = path.join(runPath, this.config.outFolder)
    this.corePath = path.join(__dirname, '../core')

    // 静态资源前缀
    this.basePath = this.config.basePath || './'
    // 静态资源输出目录
    this.staticPath = path.join(this.outPutPath, 'static')
  }
  // 输出script
  outPutScript (scriptData) {
    log.debug('输出scriptData')
    this.htmlTemple = this.htmlTemple.replace(`<!-- script-output -->`, scriptData)
    this.outPutHtml()
  }
  // 输出页面切换动画
  outPutAnimation () {
    spinner.text = '正在处理动画'
    // 判断“动画”集合是否为空
    if (this.animationList.size === 0) {
      this.htmlTemple = this.htmlTemple.replace(`<!-- animation-output -->`, '')
    } else {
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
      fs.writeFileSync(animationPath, animationData)
      this.htmlTemple = this.htmlTemple.replace(`<!-- animation-output -->`, `<link rel="stylesheet" href="${this.basePath}static/css/owo.animation${versionString}.css">`)
    }
  }

  // 处理script
  handleScript (dom, changePath) {
    log.info('正在处理script!')
    spinner.text = '正在处理script'
    // 版本号后缀
    const versionString = this.config.outPut.addVersion ? `.${this.version}` : ''
    // 根据不同情况使用不同的core
    // 读取出核心代码
    let coreScript = Tool.loadFile(path.join(this.corePath, 'main.js'))
    if (this.config.pageList.length === 1) {
      // 单页面
      log.info('工程中只有一个页面!')
      coreScript += Tool.loadFile(path.join(this.corePath, 'SinglePage.js'))
    } else {
      // 多页面
      log.info('工程中包含多个页面!')
      coreScript += Tool.loadFile(path.join(this.corePath, 'MultiPage.js'))
    }
    // 加载页面就绪事件插件
    coreScript += Tool.loadFile(path.join(this.corePath, 'whenReady.js'))
    // 页面切换特效
    // 处理使用到的特效
    let useAnimationList = Cut.stringArray(coreScript, '$go(', ')')
    // 遍历特效函数
    useAnimationList.forEach(element => {
      element = element.replace(/"/g, '')
      element = element.replace(/'/g, '')
      element = element.replace(/ /g, '')
      // 取出每一个参数
      const parameterList = element.split(',')
      if (parameterList[1]) {
        // 一个动画里面可能有多个动画
        const temp = parameterList[1].split('&')
        temp.forEach(animation => {
          this.animationList.add(animation)
        })
      }
      if (parameterList[2]) {
        // 一个动画里面可能有多个动画
        const temp = parameterList[2].split('&')
        temp.forEach(animation => {
          this.animationList.add(animation)
        })
      }
    })
    
    this.outPutAnimation()
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
    
    // 处理使用到的方法
    let toolList = Cut.stringArray(dom.script, 'owo.tool.', '(')
    let toolList2 = Cut.stringArray(dom.script, '$tool.', '(')
    // 数组去重
    toolList = new Set(toolList.concat(toolList2))
    toolList.forEach(element => {
      // console.log(element)
      coreScript += Tool.loadFile(path.join(this.corePath, 'tool', `${element}.js`))
    })
    // 使用bable处理代码
    let mainScript = Script(coreScript, this.config.outPut.minifyJs).code
    // ----------------------------------------------- 输出js -----------------------------------------------
    const scriptDir = path.join(this.staticPath, 'js')
    // 判断并创建js目录
    Tool.creatDirIfNotExist(scriptDir)

    let scriptData = ''
    // 判断样式是合并到html中还是放在main.css里
    if (this.config.outPut.merge) {
      log.debug('选择将js合并到html中!')
      scriptData = `<!-- owo框架代码 --><script>${Script(dom.script).code}</script>\r\n<!-- 框架script文件 -->\r\n<script src="${this.basePath}static/js/owo.main${versionString}.js" type="text/javascript"></script>`
      // 输出时间和框架信息
      mainScript = `// build by owo frame!\r\n// ${new Date().toString()}\r\n\r\n` + mainScript
    } else {
      scriptData = `<!-- 框架script文件 -->\r\n<script src="${this.basePath}static/js/owo.main${versionString}.js" type="text/javascript"></script>`

      // 输出时间和框架信息
      mainScript = `// build by owo frame!\r\n// ${new Date().toString()}\r\n\r\n` + Script(dom.script).code + '\r\n\r\n' + mainScript
    }
    
    // 处理js中的资源
    if (this.config.resourceFolder) {
      mainScript = resourceHandle(mainScript, path.join(runPath, this.config.resourceFolder), path.join(this.staticPath, 'resource'), `${this.basePath}static/resource/`, this.config.outPut.embedSize)
    }
    // 添加解决方案
    if (this.config.scheme) {
      this.config.scheme.forEach(element => {
        log.debug(`添加解决方案: ${element}`)
        mainScript += '\r\n' + Tool.loadFile(path.join(this.corePath, 'scheme', `${element}.js`))
      })
    }
    log.info('js中的资源处理完毕!')
    // 写出主要硬盘文件
    fs.writeFileSync(path.join(this.staticPath, 'js' , `owo.main${versionString}.js`), mainScript)
    // 加入框架代码
    
    // 判断是否需要加入自动刷新代码
    if (this.config.autoReload) {
      if (!changePath) {
        Tool.moveFile(path.join(this.corePath, 'debug', 'autoReload.js'), path.join(this.staticPath, 'js', `autoReload.js`))
      }
      scriptData += `\r\n<!-- 调试-热刷新代码 -->\r\n<script src="${this.basePath}static/js/autoReload.js" type="text/javascript"></script>`
    }
    // 判断是否启用远程调试
    if (this.config.remoteDebug) {
      if (!changePath) {
        Tool.moveFile(path.join(this.corePath, 'debug', 'log.js'), path.join(this.staticPath, 'js', `log.js`))
      }
      scriptData += `\r\n<!-- 调试-远程调试 -->\r\n<script src="${this.basePath}static/js/log.js" type="text/javascript"></script>`
    }
    log.debug(`处理引用脚本: ${JSON.stringify(this.config.scriptList)}`)
    // 处理引用的script
    if (this.config.scriptList && this.config.scriptList.length > 0) {
      log.debug(`外部脚本数量: ${this.config.scriptList.length}`)
      // 遍历引用列表
      let completeNum = 0
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
          scriptData += `\r\n    <script src="${element.src}" type="text/javascript" ${element.defer ? 'defer="defer"' : ''}></script>`
          // 判断是否为最后项,如果为最后一项则输出script
          if (++completeNum >= this.config.scriptList.length) {
            log.debug(`完成外部脚本引用处理!`)
            this.outPutScript(scriptData)
          }
          continue
        } else {
          scriptData += `\r\n    <script src="${this.basePath}static/js/${element.name}.js" type="text/javascript" ${element.defer ? 'defer="defer"' : ''}></script>`
        }
        // 输出路径
        const outPutFile = path.join(this.staticPath, 'js', `${element.name}.js`)
        
        // 判断是否用babel处理
        if (element.babel) {
          log.debug('使用bable处理脚本!')
          if (changePath === undefined || changePath === path.join(runPath, element.src)) {
            fs.readFile(path.join(runPath, element.src), 'utf8', (err, fileData) => {
              if (err) throw err
              fs.writeFile(outPutFile, Script(fileData, this.config.outPut.minifyJs).code, () => {
                log.info(`使用babel处理并生成文件: ${outPutFile}`)
                // 判断是否为最后项,如果为最后一项则输出script
                if (++completeNum >= this.config.scriptList.length) {
                  this.outPutScript(scriptData)
                }
              })
            })
          } else {
            if (++completeNum >= this.config.scriptList.length) {
              this.outPutScript(scriptData)
            }
          }
        } else {
          log.debug('不使用bable处理脚本!')
          // 如果不使用babel处理则进行复制文件
          if (changePath === undefined || changePath === path.join(runPath, element.src)) {
            Tool.moveFile(path.join(runPath, element.src), outPutFile)
          }
          if (++completeNum >= this.config.scriptList.length) {
            this.outPutScript(scriptData)
          }
        }
      }
    } else {
      log.debug('没有使用到外部脚本!')
      // 如果没有引用script，则直接输出html
      this.outPutScript(scriptData)
    }
  }

  // 处理style
  handleStyle(dom, changePath) {
    const versionString = this.config.outPut.addVersion ? `.${this.version}` : ''
    spinner.text = '正在处理style'
    let styleData = ''
    // 添加入框架内置样式
    const mainStyle = path.join(this.corePath, `main.css`)
    let outPutCss = Tool.loadFile(mainStyle) + `\r\n` + dom.style
    // --------------------------------- 动画效果 ---------------------------------------------
    dom.useAnimationList.forEach(element => {
      this.animationList.add(element)
    })
    // 处理css中的资源文件
    if (this.config.resourceFolder) {
      const resourceFolder = path.join(runPath, this.config.resourceFolder)
      outPutCss = resourceHandle(outPutCss, resourceFolder, path.join(this.staticPath, 'resource'), `${this.basePath}static/resource/`, this.config.outPut.embedSize)
    }
    log.info('css中的资源处理完毕!')
    // ----------------------------------------------- 使用postcss处理 -----------------------------------------------
    // 自动加浏览器前缀
    // console.log(autoprefixer.process)
    let plugList = [precss, autoprefixer]
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
      


      let completeNum = 0
      
      // 如果没有额外的css直接输出
      if (!this.config.styleList || this.config.styleList.length === 0) {
        this.htmlTemple = this.htmlTemple.replace(`<!-- css-output -->`, styleData)
        this.outPutHtml()
        return
      } else {
        Tool.creatDirIfNotExist(path.join(this.staticPath, 'css'))
        styleData += `\r\n    <!-- 附属css文件 -->`
      }
      for (let ind = 0; ind < this.config.styleList.length; ind++) {
        const element = this.config.styleList[ind]
        // 判断是设置了路径
        if (!element.src) {
          console.error('style path unset!', element)
          continue
        }
        // -------------sdsd---------------------------------------------------------
        // 如果是网络地址那么不需要进行处理
        if (element.src.startsWith('http')) {
          styleData += `\r\n    <link rel="stylesheet" href="${element.src}">`
          if (++completeNum >= this.config.styleList.length) {
            this.htmlTemple = this.htmlTemple.replace(`<!-- css-output -->`, styleData)
            this.outPutHtml()
          }
          continue
        } else {
          styleData += `\r\n    <link rel="stylesheet" href="${this.basePath}static/css/${element.name}.css">`
        }
        // 输出路径
        const outPutFile = path.join(this.staticPath, 'css', `${element.name}.css`)
        const fromPath = path.join(runPath, element.src)
        if (changePath === undefined || changePath === fromPath) {
          // 判断是否需要处理资源
          if (element.resource) {
            // 处理资源并移动
            log.info('开始处理附属css中的资源')
            const resourceFolder = path.join(runPath, this.config.resourceFolder)
            fs.readFile(fromPath, (err, fileData) => {
              log.info(`读取成功: ${fromPath}`)
              if (err) throw err
              fileData = resourceHandle(fileData.toString(), resourceFolder, path.join(this.staticPath, 'resource'), `.${this.basePath}resource/`, this.config.outPut.embedSize)
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
        if (++completeNum >= this.config.styleList.length) {
          this.htmlTemple = this.htmlTemple.replace(`<!-- css-output -->`, styleData)
          this.outPutHtml()
        }
      }
    })
  }

  outPutHtml () {
    log.debug('判断是否可以输出Html!')
    // 如果文档中已经不存在output那么证明已经可以进行输出了
    if (!this.htmlTemple.includes('-output -->')) {
      spinner.text = '正在输出html'
      log.debug('准备输出html!')
      // 对html所引用的资源进行处理
      if (this.config.resourceFolder) {
        this.htmlTemple = resourceHandle(this.htmlTemple, path.join(runPath, this.config.resourceFolder), path.join(this.staticPath, 'resource'), `${this.basePath}static/resource/`, this.config.outPut.embedSize)
      }
      // 美化html
      log.debug('开始美化html')
      const beautifyHtml = beautify_html(this.htmlTemple, {
        indent_size: 2,
        inline: [
          "abbr", "area", "b", "bdi", "bdo", "br", "button", "canvas", "cite", "code", "data", "datalist", "del", "dfn", "em", "i", "iframe", "input", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript", "object", "output", "progress", "q", "ruby", "s", "samp", "select", "small", "strong", "sub", "sup", "svg", "template", "textarea", "time", "u", "var", "wbr", "text", "acronym", "address", "big", "dt", "ins", "strike", "tt"
        ],
        space_in_empty_paren: false
      })
      // 写出文件
      fs.writeFileSync(path.join(this.outPutPath, 'index.html'), beautifyHtml)
      
      spinner.text = `Compile successfully, Use time: ${new Date().getTime() - this.startTime} msec!`
      spinner.succeed()
      if (this.callBack) this.callBack()
    } else {
      log.debug('还有没有经过处理的资源!')
      // log.debug(this.htmlTemple)
    }
  }

  // 执行默认打包任务
  pack(changePath) {
    spinner.start('开始打包')
    // 记录开始打包时间
    this.startTime = new Date().getTime()
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

    
    spinner.text = '正在处理模板文件'
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
    // 处理style
    this.handleStyle(dom, changePath)
    // 处理script
    this.handleScript(dom, changePath)
  }
}

module.exports = pack