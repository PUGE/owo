const Templet = require('./templet')
const Babel = require("@babel/core")

function scriptHandle (htmlText) {
  // console.log(htmlText)
  const scriptText = Templet.cutString(htmlText, "<script>", "</script>")
  if (scriptText) {
    return Babel.transform(scriptText, {
      "presets": ["env"],
      "compact": true
    })
  }
  
}
module.exports = scriptHandle