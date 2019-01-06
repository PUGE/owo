const Templet = require('./templet')

function scriptHandle (htmlText) {
  // console.log(htmlText)
  const scriptText = Templet.cutString(htmlText, "<script>", "</script>")
  if (scriptText) {
    return scriptText
  }
  
}
module.exports = scriptHandle