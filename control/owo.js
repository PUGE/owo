module.exports = {
  // 项目根目录
  root: "/src",
  // 页面标题
  title: '{TAG_14226_TAG}',
  // 解决方案
  scheme: [],
  // 输出目录
  outFolder: "./dist",
  // 资源目录
  resourceFolder: "./src/resource",
  // head属性清单
  headList: [
    {
      'http-equiv': 'content-type',
      content: 'text/html; charset=UTF-8',
    },
    {
      name: 'viewport',
      content: 'width=1200, user-scalable=no',
    },
    {
      name: 'format-detection',
      content: 'telephone=no, email=no',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'white',
    },
    {
      name: 'renderer',
      content: 'webkit',
    },
    {
      'http-equiv': 'X-UA-Compatible',
      content: 'IE=edge,chrome=1',
    },
    {
      name: 'filetype',
      content: '1',
    },
    {
      name: 'publishedtype',
      content: '1',
    },
    {
      name: 'pagetype',
      content: '2',
    },
    {
      name: 'screen-orientation',
      content: 'landscape',
    },
    {
      name: 'x5-orientation',
      content: 'landscape',
    },
    {
      name: 'full-screen',
      content: 'yes',
    },
    {
      name: 'x5-fullscreen',
      content: 'true',
    },
    {
      name: 'browsermode',
      content: 'application',
    },
    {
      name: 'x5-page-mode',
      content: 'app',
    }
  ],
  // 使用到的外部脚本清单
  scriptList: [
    {
      name: "main",
      src: "./src/main.js",
      resource: true
    }
  ],
  // 使用到的样式列表
  styleList: [
    {
      name: "main",
      src: "./src/main.css",
      resource: true
    }
  ],
  // 页面清单
  pageList: [
    {
      name: 'home',
      src: './src/page/home.owo'
    }
  ],
  // 调试模式配置
  dev: {
    // 基础目录
    basePath: './',
    debug: true,
    // 是否监测文件改动重新打包
    watcher: {
      // 是否启用
      enable: true,
      // 忽略监控的文件或文件夹，支持正则，默认为输出目录
      ignored: './dist/*',
      // 监测深度,默认99
      depth: 99
    },
    // 输出配置
    outPut: {
      // 是否将主要css, js合并到html中
      merge: true,
      // 是否压缩css
      minifyCss: false,
      // 是否压缩js
      minifyJs: false,
      // 输出文件自动追加版本号，可以用来消除缓存
      addVersion: false,
      allAnimate: false
    },
    serverPort: 8000,
    // 静态文件服务
    server: true,
    // 自动重新加载
    autoReload: true,
    // 远程调试
    remoteDebug: false
  },
  // 编译模式配置
  build: {
    debug: false,
    // 基础目录
    basePath: './',
    // 外链警告
    alertLink: true,
    // 输出配置
    outPut: {
      // 是否压缩css
      minifyCss: false,
      // 是否压缩js
      minifyJs: false,
      // 输出文件自动追加版本号，可以用来消除缓存
      addVersion: true,
      // 小于多大的资源会嵌入到代码中,单位kb,默认10,设置为0则不启用
      embedSize: 0,
      // 将重要样式和js合并到html中以优化页面打开速度
      merge: false,
      // 输出所有动画效果
      allAnimate: false
    }
  }
}