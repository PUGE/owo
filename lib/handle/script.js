// 配置输出插件
const path = require('path')
const Babel = require("@babel/core")

function scriptHandle (scriptText, minifyJs) {
  // const scriptText = Templet.cutString(htmlText, "<script>", "</script>")
  if (scriptText) {
    if (typeof scriptText === 'string') {
      // 处理不正确的换行符
      scriptText = scriptText.replace(/\\n/g, '\n')
      // 处理不正确的空格符
      scriptText = scriptText.replace(/\\t/g, '\t')
      // 不知道可不可以异步
      return Babel.transformSync(scriptText, {
        cwd: path.join(__dirname, '../../'),
        presets: [
          [
            "@babel/preset-env",
            {
              // 使代码更像是手写的
              "loose": true,
              "modules": false,
              "targets": {
                "chrome": "58",
                "ie": "8"
              }
            }
          ]
        ],
        plugins: [

        ],
        compact: minifyJs,   // 省略换行符和空格
        // comments: false, // 去掉注释
      })
    } else {
      console.error('scriptText数据类型不正确!')
    }
  }
}
module.exports = scriptHandle