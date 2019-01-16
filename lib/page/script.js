const Templet = require('../templet')
const Babel = require("@babel/core")

function scriptHandle (htmlText) {
  // console.log(htmlText)
  const scriptText = Templet.cutString(htmlText, "<script>", "</script>")
  if (scriptText) {
    return Babel.transform(scriptText, {
      presets: [
        "@babel/preset-env"
      ],
      compact: true,
      comments: false, // 去掉注释
    })
  }
  
}
module.exports = scriptHandle