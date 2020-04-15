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
const Fontmin = require('fontmin');
// 配置输出插件
const log = require('./tool/log')

const handleLink = require('./tool/handleLink.js')

function getAni (config, aniList) {
  function getAniFormObj(obj) {
    if(obj.in) Storage.pageAnimationList.add(obj.in)
    if(obj.out) Storage.pageAnimationList.add(obj.out)
    if(obj.backIn) Storage.pageAnimationList.add(obj.backIn)
    if(obj.backOut) Storage.pageAnimationList.add(obj.backOut)
  }
  if (config.globalAni) {
    getAniFormObj(config.globalAni)
  }
  for (const key in config.pageAni) {
    getAniFormObj(config.pageAni[key])
  }
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
    this.outPutScriptData = ''
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
    this.callBackInfo('switch', '正在处理动画!')
    let animationData = '\r\n'
    // 判断动画是否为空
    if (this.config.allAnimation || Storage.pageAnimationList.size > 0) {
      animationData += `/* 页面切换动画 */\r\n`
      // 判断是全部输出还是
      if (this.config.allAnimation) {
        animationData += Tool.loadFile(path.join(this.corePath, 'switch', `animations.css`)) + '\r\n'
      } else {
        Storage.pageAnimationList.forEach(animationName => {
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
      Storage.animateList.add(element)
    })
    Storage.plugList.add('animate')
  }
  // 输出动画效果
  outPutAnimate () {
    // console.log(Storage.animateList)
    this.callBackInfo('outAnimation', '正在输出动画!')
    let animationData = '\r\n'
    // 判断“动画”集合是否为空
    if (this.config.allAnimate || Storage.animateList.size > 0) {
      animationData += `/* 动画效果 */\r\n`
      // 版本号
      const versionString = this.config.addVersion ? `.${this.version}` : ''
      // 判断是否设置了输出所有
      if (this.config.allAnimate) {
        const animationFilePath = path.join(this.corePath, 'animate', `animate.css`)
        animationData += Tool.loadFile(animationFilePath) + '\r\n'
      } else {
        Storage.animateList.forEach(animationName => {
          const animationFilePath = path.join(this.corePath, 'animate', `${animationName}.css`)
          animationData += Tool.loadFile(animationFilePath) + '\r\n'
        })
      }
    }
    return animationData
  }

  outOtherScript () {
    return new Promise((resolve, reject) => {
      if (!this.config.scriptList || this.config.scriptList.length === 0) resolve(['', ''])
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
          let temp = `\r\n    <script src="${element.src}" type="text/javascript" ${element.defer ? 'defer="defer"' : ''} charset="UTF-8"></script>`
          // 判断是否需要处理外链信息
          
          if (this.config.handleLink) {
            temp = handleLink(temp, path.join(process.cwd(), this.config.outFolder) + '/static/js/', './static/js/')
          }
          if (element.afterbody) afterbody += temp
          else beforebody += temp
          continue
        } else {
          const fromPath = path.join(runPath, element.src)
          // 记录下需要监视的样式文件
          Storage.watcherFile[fromPath.replace(/\\/g, '/')] = {
            type: 'js',
            src: element.src,
            name: element.name,
            resource: element.resource,
            babel: element.babel,
            merge: element.merge,
            afterbody: element.afterbody
          }
          let fileData = fs.readFileSync(path.join(runPath, element.src), 'utf8')
          // 插件做处理
          fileData = register.otherJSFile(fileData, element, this.config)
          if (element.merge === 'html') {
            const temp = `\r\n<script type="text/javascript" ${element.defer ? 'defer="defer"' : ''} charset="UTF-8">\r\n${fileData}\r\n</script>`
            if (element.afterbody) afterbody += temp
            else beforebody += temp
          } else if (element.merge === 'core') {
            // 判断是否后部加载
            if (element.afterbody) {
              this.outPutScriptData += '\r\n' + fileData
            } else {
              this.outPutScriptData += fileData + '\r\n' + this.outPutScriptData
            }
          } else {
            const temp = `\r\n    <script src="${this.basePath}static/js/${element.name}.js" type="text/javascript" ${element.defer ? 'defer="defer"' : ''} charset="UTF-8"></script>`
            // console.log(element.afterbody, temp)
            if (element.afterbody) afterbody += temp
            else beforebody += temp
            Tool.creatDirIfNotExist(path.join(this.staticPath, 'js'))
            // 输出路径
            const outPutFile = path.join(this.staticPath, 'js', `${element.name}.js`)
            fs.writeFile(outPutFile, fileData, (e) => {
              if (e) throw e
              log.debug(`处理文件: ${outPutFile}`)
            })
          }
        }
      }
      // console.log(afterbody)
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

  outPutHtml () {
    this.callBackInfo('outPutHtml', '正在输出Html!')
    log.debug('准备输出html!')

    this.htmlTemple = register.outPutHtml(this.htmlTemple, this.config)
    // 写出文件
    fs.writeFileSync(path.join(this.outPutPath, 'index.html'), this.htmlTemple)
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
      dom.script = register.JSData(dom.script, this.config)
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
      scriptData = `\r\n<!-- 框架script文件 -->\r\n<script src="${this.basePath}static/js/owo.core${versionString}.js" type="text/javascript" charset="UTF-8"></script>\r\n<script type="text/javascript" charset="UTF-8">\r\n${pageScript}\r\n</script>`
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
          if (goValue.inAnimation) Storage.pageAnimationList.add(goValue.inAnimation)
          if (goValue.outAnimation) Storage.pageAnimationList.add(goValue.outAnimation)
          if (goValue.ani) {
            goValue.ani.split('/').forEach(aniItem => {
              Storage.pageAnimationList.add(aniItem)
            })
          }
        })
      }
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
  outOtherStyle () {
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
          const fromPath = path.join(runPath, element.src)
          // 记录下需要监视的样式文件
          Storage.watcherFile[fromPath.replace(/\\/g, '/')] = {
            type: 'css',
            src: element.src,
            name: element.name,
            resource: element.resource
          }
          // 处理文件
          register.otherCSSFile(element, this.config)
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
      register.CSSData(outPutCss, this.config).then((data) => {
        dom.style = data
        resolve(dom.style)
      })
    })
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
      // 统一路径为左斜线
      changePath = changePath.replace(/\\/g, '/')
      const watcherFileItem = Storage.watcherFile[changePath]
      // 如果不是监听目录 那么什么也不做
      if (!watcherFileItem) return
      // 如果是owo页面文件 需要重新打包
      if (watcherFileItem.type !== 'page' && watcherFileItem.type !== 'block' && watcherFileItem.type !== 'plug') {
        register.fileChange(changePath, this)
        log.info(`刷新模式,变化目录: ${changePath}`)
        return
      }
    }
    // 清理图片缓存
    register.clear()
    Storage.clear()
    // 读取入口模板文件(一次性读取到内存中)
    log.info(`读取内置模板文件`)
    this.htmlTemple = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')

    log.debug(`处理页面源信息: ${JSON.stringify(this.config.headList)}`)
    this.htmlTemple = Hrard(this.config, this.htmlTemple)

    const dom = Body(this.htmlTemple, this.config)
    // 获取全局设置的页面切换动画
    getAni(this.config)
    this.htmlTemple = dom.html
    
    // 处理内部style和外部引用style
    Promise.all([this.handleStyle(dom), this.outOtherStyle()]).then(styleData => {
      const versionString = this.config.addVersion ? `.${this.version}` : ''
      this.htmlTemple = this.htmlTemple.replace(`<!-- css-output -->`, `
      <!-- 页面主样式文件 -->
      <link charset="utf-8"  rel="stylesheet" href="${this.basePath}static/css/owo.core${versionString}.css">
      ${styleData[1]}
      `)
      
      // 处理script
      Promise.all([this.handleScript(dom), this.outOtherScript()]).then(scriptData => {
        log.debug('输出scriptData')
        this.htmlTemple = this.htmlTemple.replace(`<!-- script-output -->`, scriptData[1][0] + scriptData[0] + scriptData[1][1])
        // 处理Html中的动画方法
        this.extractAnimate(this.htmlTemple)
        // ------------------------------- 输出style -------------------------------
        this.outPutStyle(styleData[0] + this.outPutAnimation() + this.outPutAnimate())
        // ------------------------------- 输出HTML -------------------------------
        this.outPutHtml()
        // ------------------------------- 输出Script -------------------------------
        this.outPutScript(dom.pageArr)
        // ------------------------------- 编译结束 -------------------------------
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