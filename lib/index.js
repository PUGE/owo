#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')

// 注册事件回调
const register = require('./register')
// 命令行运行目录
const runPath = process.cwd()
const Storage = require('./storage')
const Tool = require('./tool/tool')
const Hrard = require('./handle/hrard')
const Script = require('./handle/script')
const Body = require('./page/body')
// 配置输出插件
const log = require('./tool/log')

// js预处理
const postcss      = require('postcss')

// 字体处理
const Fontmin = require('fontmin')


// 资源文件处理
const Resource = require('./resource')

function getAni (config, aniList) {
  function getAniFormObj(obj) {
    if(obj.in) aniList.add(obj.in)
    if(obj.out) aniList.add(obj.out)
    if(obj.backIn) aniList.add(obj.backIn)
    if(obj.backOut) aniList.add(obj.backOut)
  }
  if (config.globalAni) {
    getAniFormObj(config.globalAni)
  }
  for (const key in config.pageAni) {
    getAniFormObj(object[key])
  }
  return aniList
}

class pack {
  //构造函数
  constructor(config, callBack) {
    // 进度显示
    this.config = config
    // 打包的版本号
    this.version = ''
    this.htmlTemple = null
    this.callBack = callBack
    this.pageAnimationList = new Set()
    this.animateList = new Set()
    this.outPutScriptData = ''
    // 输出目录
    this.outPutPath = path.join(runPath, this.config.outFolder)
    this.corePath = path.join(__dirname, '../core')
    // 静态资源前缀
    this.basePath = this.config.basePath || './'
    // 图片资源
    this.resource = new Resource()
    // 插件引用信息
    this.plugList = new Set()
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
    this.callBackInfo('switch', '正在处理动画!')
    let animationData = '\r\n'
    // 判断动画是否为空
    if (this.config.allAnimation || this.pageAnimationList.size > 0) {
      animationData += `/* 页面切换动画 */\r\n`
      // 判断是全部输出还是
      if (this.config.allAnimation) {
        animationData += Tool.loadFile(path.join(this.corePath, 'switch', `animations.css`)) + '\r\n'
      } else {
        this.pageAnimationList.forEach(animationName => {
          if (animationName) {
            const animationFilePath = path.join(this.corePath, 'switch', `${animationName}.css`)
            animationData += Tool.loadFile(animationFilePath) + '\r\n'
          }
        })
      }
    }
    return animationData
  }
  // 提取需要用到动画
  extractAnimate (text) {
    // 无论多页面还是单页面都需要处理动画效果
    // log.info('-------------------')
    // log.info(text)
    let useAnimateList =  Tool.cutStringArray(text, 'owo.animate(', ',')
    // console.log(useAnimateList)
    if (useAnimateList.length === 0) return
    // 遍历特效函数
    useAnimateList.forEach(element => {
      element = element.replace(/"/g, '')
      element = element.replace(/'/g, '')
      element = element.replace(/ /g, '')
      this.animateList.add(element)
    })
    this.plugList.add('animate')
  }
  // 输出动画效果
  outPutAnimate () {
    // console.log(this.animateList)
    this.callBackInfo('outAnimation', '正在输出动画!')
    let animationData = '\r\n'
    // 判断“动画”集合是否为空
    if (this.config.allAnimate || this.animateList.size > 0) {
      animationData += `/* 动画效果 */\r\n`
      // 版本号
      const versionString = this.config.addVersion ? `.${this.version}` : ''
      // 判断是否设置了输出所有
      if (this.config.allAnimate) {
        const animationFilePath = path.join(this.corePath, 'animate', `animate.css`)
        animationData += Tool.loadFile(animationFilePath) + '\r\n'
      } else {
        this.animateList.forEach(animationName => {
          const animationFilePath = path.join(this.corePath, 'animate', `${animationName}.css`)
          animationData += Tool.loadFile(animationFilePath) + '\r\n'
        })
      }
    }
    return animationData
  }

  outOtherScript () {
    return new Promise((resolve, reject) => {
      if (!this.config.scriptList || this.config.scriptList.length === 0) resolve('')
      log.debug(`外部脚本数量: ${this.config.scriptList.length}`)
      let beforebody = '\r\n'
      let afterbody = '\r\n'
      for (let ind = 0; ind < this.config.scriptList.length; ind++) {
        const element = this.config.scriptList[ind]
        // console.log(element)
        log.debug(`处理脚本: ${element.name}`)
        // 判断是设置了路径
        if (!element.src) {
          log.error('script path unset!', element)
          continue
        }
        // 可以缓存
        // 如果是网络地址那么不需要进行处理
        if (element.src.startsWith('http')) {
          log.debug(`网络脚本: ${element.name}`)
          const temp = `\r\n    <script src="${element.src}" type="text/javascript" ${element.defer ? 'defer="defer"' : ''} charset="UTF-8"></script>`
          if (element.afterbody) afterbody += temp
          else beforebody += temp
          continue
        } else {
          if (element.merge) {
            if (element.babel) {
              this.outPutScriptData = Script(fs.readFileSync(path.join(runPath, element.src)), this.config.minifyJs).code + '\r\n' + this.outPutScriptData
            } else {
              this.outPutScriptData = fs.readFileSync(path.join(runPath, element.src)) + '\r\n' + this.outPutScriptData
            }
          } else {
            // 判断是否用babel处理
            // 输出路径
            const outPutFile = path.join(this.staticPath, 'js', `${element.name}.js`)
            // 判断是否将JS合并
            if (element.babel) {
              log.debug('使用bable处理脚本!')
              fs.readFile(path.join(runPath, element.src), 'utf8', (err, fileData) => {
                if (err) throw err
                fs.writeFile(outPutFile, Script(fileData, this.config.minifyJs).code, () => {
                  log.info(`使用babel处理并生成文件: ${outPutFile}`)
                })
              })
            } else {
              Tool.moveFile(path.join(runPath, element.src), outPutFile)
            }
            const temp = `\r\n    <script src="${this.basePath}static/js/${element.name}.js" type="text/javascript" ${element.defer ? 'defer="defer"' : ''} charset="UTF-8"></script>`
            if (element.afterbody) afterbody += temp
            else beforebody += temp
          }
        }
      }
      resolve([beforebody, afterbody])
    })
  }

  outPutScript (pageArr) {
    // 版本号后缀
    const versionString = this.config.addVersion ? `.${this.version}` : ''
    // 判断是否需要加入自动刷新代码
    if (this.config.autoReload) {
      this.outPutScriptData += `\r\n\r\n` + Tool.loadFile(path.join(this.corePath, 'debug', 'autoReload.js'))
    }
    // 判断是否启用远程调试
    if (this.config.remoteDebug) {
      this.outPutScriptData += `\r\n\r\n` + Tool.loadFile(path.join(this.corePath, 'debug', 'log.js'))
    }
    this.outPutScriptData += `\r\n\r\n`
    // ----------------------------------------------- 输出js -----------------------------------------------
    if (pageArr.length !== 0) {
      const scriptDir = path.join(this.staticPath, 'js')
      // 判断并创建js目录
      Tool.creatDirIfNotExist(scriptDir)
      // 写出主要硬盘文件
      fs.writeFile(path.join(this.staticPath, 'js' , `owo.core${versionString}.js`), this.outPutScriptData, () => {
        log.info(`主要逻辑文件写出成功!`)
      })
    }
  }
  // 处理script
  handleScript (dom) {
    return new Promise((resolve, reject) => {
      if (dom.pageArr.length === 0) {
        log.info('页面不需要script!')
        resolve('')
      }
      
      log.info('正在处理script!')
      this.callBackInfo('script', '正在处理函数!')
      // 版本号后缀
      const versionString = this.config.addVersion ? `.${this.version}` : ''
      
      // 处理js中的资源
      log.debug('开始处理script中的资源!')
      const scriptResourceStartTime = new Date().getTime()
      dom.script = this.resource.handle(dom.script, this.config, this.basePath + 'static/', this.staticPath)
      log.debug(`script中的资源处理完毕! 用时: ${new Date().getTime() - scriptResourceStartTime} 毫秒`)

      // 添加入owo代码
      const mainPath = path.join(this.corePath, 'main')
      fs.readdirSync(mainPath).forEach(fileName => {
        this.outPutScriptData += Tool.loadFile(`${mainPath}/${fileName}`) + '\r\n'
      })

      // 处理动画效果
      this.extractAnimate(dom.script)
      // 页面JS代码
      const pageScript = Script(dom.script).code
      let scriptData = ''
      scriptData = `\r\n      <!-- 框架script文件 -->\r\n    <script src="${this.basePath}static/js/owo.core${versionString}.js" type="text/javascript" charset="UTF-8"></script>\r\n<script>\r\n${pageScript}</script>`
      // 输出时间和框架信息
      this.outPutScriptData = `// ${new Date().toString()}\r\nvar owo = {tool: {},state: {},};\r\n` + this.outPutScriptData

      if (this.config.pageList.length === 1) {
        log.info('工程中只有一个页面!')
        this.outPutScriptData += Tool.loadFile(path.join(this.corePath, 'SinglePage.js'))
      } else {
        log.info('工程中包含多个页面!')
        this.outPutScriptData += Tool.loadFile(path.join(this.corePath, 'MultiPage.js'))
        // 检测js中的动画
        let useAnimationList = Tool.cutStringArray(pageScript, 'owo.go(', ')').concat(Tool.cutStringArray(this.htmlTemple, 'owo.go(', ')'))
        useAnimationList.forEach(goValue => {
          // 待优化 直接使用ani
          goValue = eval(`(${goValue})`)
          if (goValue.inAnimation) this.pageAnimationList.add(goValue.inAnimation)
          if (goValue.outAnimation) this.pageAnimationList.add(goValue.outAnimation)
          if (goValue.ani) {
            goValue.ani.split('/').forEach(aniItem => {
              this.pageAnimationList.add(aniItem)
            })
          }
        })
      }
      this.plugList = [...dom.plugList]
      log.info('js中的资源处理完毕!')
      
      // 模板插值处理
      const temp = Tool.cutStringArray(this.outPutScriptData, '/* if="', '" */')
      // console.log(this.htmlTemple)
      temp.forEach(condition => {
        let startText = `/* if="${condition}" */`
        const valueItem = eval(condition)
        let content = ''
        let endText = `/* end="${condition}" */`
        content = Tool.cutString(this.outPutScriptData, startText, endText)
        let replacrStr = startText + content + endText
        if (valueItem) {
          this.outPutScriptData = this.outPutScriptData.replace(replacrStr, content)
        } else {
          this.outPutScriptData = this.outPutScriptData.replace(replacrStr, '')
        }
      })
      log.debug(`处理引用脚本: ${JSON.stringify(this.config.scriptList)}`)
      resolve(scriptData)
    })
  }

  // 处理字体
  handleFont (fontList) {
    if (fontList.length === 0) return
    for (const key in fontList) {
      if (fontList.hasOwnProperty(key)) {
        const element = fontList[key]
        log.info(`处理使用字体文字:\r\n${element}`)
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
              fileData = this.resource.handle(fileData.toString(), this.config, '../', this.staticPath)
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
  outPutStyle (styleData) {
    const versionString = this.config.addVersion ? `.${this.version}` : ''
    // 使用插件进行处理
    styleData = register.outPutHtml(styleData, this.config)
    // 写出样式文件
    Tool.creatDirIfNotExist(path.join(this.staticPath, 'css'))
    const outPutFile = path.join(this.staticPath, 'css', `owo.core${versionString}.css`)
    fs.writeFile(outPutFile, styleData, () => {
      log.info(`写入文件: ${outPutFile}`)
    })
  }
  // 处理style
  handleStyle(dom) {
    return new Promise((resolve, reject) => {
      log.info('开始处理style')
      // 添加入框架内置样式
      const mainStyle = path.join(this.corePath, `main.css`)
      let outPutCss = Tool.loadFile(mainStyle) + `\r\n` + dom.style
      
      // 判断是否设置了资源文件夹
      if (this.config.resourceFolder) {
        log.debug('开始处理css中的资源!')
        const cssResourceStartTime = new Date().getTime()
        outPutCss = this.resource.handle(outPutCss, this.config, '../', this.staticPath)
        log.debug(`css中的资源处理完毕! 用时: ${new Date().getTime() - cssResourceStartTime} 毫秒`)
      }
      
      // ----------------------------------------------- 使用postcss处理 -----------------------------------------------
      // 自动加浏览器前缀
      // console.log(autoprefixer.process)
      let postPlugList = [require('autoprefixer')]
      // 判断是否压缩优化css
      if (this.config.minifyCss) {
        postPlugList.push(require('cssnano')({
          preset: 'default',
        }))
      }
      
      log.debug(`使用postcss处理样式，使用了${postPlugList.length}个插件!`)
      const postStartTime = new Date().getTime()
      postcss(postPlugList).process(outPutCss, { from: undefined}).then( (result) => {
        
        // console.log(result)
        log.info(`使用postcss处理完毕! 用时: ${new Date().getTime() - postStartTime} 毫秒`)
        result.warnings().forEach((warn) => {
          console.warn(warn.toString())
        })
        // console.log(result.css)
        dom.style = result.css
        resolve(dom.style)
      })
    })
  }

  outPutHtml () {
    this.callBackInfo('outPutHtml', '正在输出Html!')
    log.debug('准备输出html!')
    // 对html所引用的资源进行处理
    this.htmlTemple = this.resource.handle(this.htmlTemple, this.config, this.basePath + 'static/', this.staticPath)
    // 如果是debug模式那么不需要进行优化
    this.htmlTemple = register.outPutHtml(this.htmlTemple, this.config)
    // 写出文件
    fs.writeFileSync(path.join(this.outPutPath, 'index.html'), this.htmlTemple)
  }

  // 执行默认打包任务
  pack(changePath) {
    // 清理上次打包数据
    this.outPutScriptData = ''
    // console.log(this.config.title)
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
    // 页面切换动画列表
    this.pageAnimationList = getAni(this.config, dom.pageAnimationList)
    this.htmlTemple = dom.html
    
    // 处理内部style和外部引用style
    Promise.all([this.handleStyle(dom), this.outOtherStyle(changePath)]).then(styleData => {
      const versionString = this.config.addVersion ? `.${this.version}` : ''
      const tempData = `
      <!-- 页面主样式文件 -->
      <link charset="utf-8"  rel="stylesheet" href="${this.basePath}static/css/owo.core${versionString}.css">
      ${styleData[1]}
      `
      this.htmlTemple = this.htmlTemple.replace(`<!-- css-output -->`, tempData)
      
      // 处理script
      Promise.all([this.handleScript(dom, changePath), this.outOtherScript(changePath)]).then(scriptData => {
        log.debug('输出scriptData')
        
        this.htmlTemple = this.htmlTemple.replace(`<!-- script-output -->`, scriptData[1][0] + scriptData[0]) + scriptData[1][1]
        // 处理Html中的动画方法
        this.extractAnimate(this.htmlTemple)
        // 输出style
        this.outPutStyle(styleData[0] + this.outPutAnimation() + this.outPutAnimate())

        this.outPutHtml()
        this.outPutScript(dom.pageArr)
        log.info('编译结束!')
        this.callBackInfo('end', '编译结束!')
        return
      })
    })
    // 处理字体
    this.handleFont(dom.fontList)
  }
}

module.exports = pack