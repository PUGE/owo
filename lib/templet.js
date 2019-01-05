const templet = {
  cutString: function (original, before, after, index) {
    index = index || 0
    if (typeof index === "number") {
      const P = original.indexOf(before, index)
      if (P > -1) {
        if (after) {const f = original.indexOf(after, P + 1)
          return (f>-1)? original.slice(P + before.toString().length, f):console.error("owo [在文本中找不到 参数三 "+after+"]")
        } else {
          return original.slice(P + before.toString().length);
        }
      } else {
        console.error("owo [在文本中找不到 参数一 " + before + "]")
      }
    } else {
      console.error("owo [sizeTransition:" + index + "不是一个整数!]")
    }
  },
  cutStringArray: function (original,before,after,index) {
    let aa=[], ab=0;
    while(original.indexOf(before,index) > 0){
      aa[ab]=this.cutString(original,before,after,index);
      index=original.indexOf(before,index)+1;ab++;
    }
    return aa;
  }
}

module.exports = templet