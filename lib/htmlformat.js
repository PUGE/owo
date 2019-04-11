'use strict'
// 解析html
const jsdom = require("jsdom")
const { JSDOM } = jsdom


function style_html(html_source) {
  const document = new JSDOM(html_source)
  let body = document.serialize()
  console.log(document.window)
  return body
}

module.exports = style_html