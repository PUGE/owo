'use strict'
const templet = {
  cutString: function (original, before, after, index) {
    index = index || 0
    if (typeof index === "number") {
      const P = original.indexOf(before, index)
      if (P > -1) {
        if (after) {const f = original.indexOf(after, P + before.length)
          // console.log(P, f)
          // console.log(original.slice(P + before.toString().length, f))
          return (f>-1)? original.slice(P + before.toString().length, f) : ''
        } else {
          return original.slice(P + before.toString().length);
        }
      } else {
        return ''
      }
    } else {
      console.error("owo [sizeTransition:" + index + "不是一个整数!]")
    }
  },
  cutStringArray: function (original, before, after, index, inline) {
    let aa=[], ab=0;
    while(original.indexOf(before,index) > 0) {
      const temp = this.cutString(original, before, after, index)
      if (temp !== '') {
        if (inline) {
          if (temp.indexOf('\n') === -1) {
            aa[ab] = temp
            ab++
          }
        } else {
          aa[ab] = temp
          ab++
        }
      }
      // console.log(before)
      index = original.indexOf(before, index) + 1
    }
    return aa;
  },
  trim: function (text) {
    if (text) {
      return text.replace(/(^\s*)|(\s*$)/g, "")
    } else {
      return ''
    }
  }
}

module.exports = templet