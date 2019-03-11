const Babel = require("@babel/core")

function scriptHandle (scriptText, minifyJs) {
  // console.log(scriptText)
  // const scriptText = Templet.cutString(htmlText, "<script>", "</script>")
  if (scriptText) {
    return Babel.transform(scriptText, {
      presets: [
        "@babel/preset-env"
      ],
      plugins: ["syntax-dynamic-import"],
      compact: minifyJs,   // 省略换行符和空格
      // comments: false, // 去掉注释
    })
  }
  
}
module.exports = scriptHandle