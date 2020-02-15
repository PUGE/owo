// 使IE支持 getElementsByClassName
if (!('getElementsByClassName' in document)) {
  function getElementsByClassName (classList) {
    if (typeof classList !== 'string') throw TypeError('the type of classList is error')
    // 获取父元素
    var parent = this
    // 获取相应子元素
    var child = parent.getElementsByTagName('*')
    var nodeList = []
    // 获得classList的每个类名 解决前后空格 以及两个类名之间空格不止一个问题
    var classAttr = classList.replace(/^\s+|\s+$/g, '').split(/\s+/)
    for (var j = 0, len = child.length; j < len; j++) {
      var element = child[j]
      for (var i = 0, claLen = classAttr.length; i < claLen; i++) {
        var className = classAttr[i]
        if (element.className.search(new RegExp('(\\s+)?'+className+'(\\s+)?')) === -1) break
      }
      if (i === claLen) nodeList.push(element)
    }
    return nodeList
  }
  // 兼容ie5及以上的document的getElementsByClassName接口
  document.getElementsByClassName = getElementsByClassName
  // 兼容ie8及以上的getElementsByClassName接口
  window.Element.prototype.getElementsByClassName = getElementsByClassName
}

// 使IE支持 classList
if (!("classList" in document.documentElement)) {
  Object.defineProperty(window.Element.prototype, 'classList', {
    get: function () {
      var self = this
 
      function update(fn) {
        return function () {
          var className = self.className.replace(/^\s+|\s+$/g, ''),
            valArr = arguments
 
          return fn(className, valArr)
        }
      }
 
      function add_rmv (className, valArr, tag) {
        for (var i in valArr) {
          if(typeof valArr[i] !== 'string' || !!~valArr[i].search(/\s+/g)) throw TypeError('the type of value is error')
          var temp = valArr[i]
          var flag = !!~className.search(new RegExp('(\\s+)?'+temp+'(\\s+)?'))
          if (tag === 1) {
            !flag ? className += ' ' + temp : ''
          } else if (tag === 2) {
            flag ? className = className.replace(new RegExp('(\\s+)?'+temp),'') : ''
          }
        }
        self.className = className
        return tag
      }
 
      return {
        add: update(function (className, valArr) {
          add_rmv(className, valArr, 1)
        }),
 
        remove: update(function (className, valArr) {
          add_rmv(className, valArr, 2)
        }),
 
        toggle: function (value) {
          if(typeof value !== 'string' || arguments.length === 0) throw TypeError("Failed to execute 'toggle' on 'DOMTokenList': 1 argument(string) required, but only 0 present.")
          if (arguments.length === 1) {
            this.contains(value) ? this.remove(value) : this.add(value)
            return
          }
          !arguments[1] ? this.remove(value) : this.add(value)
        },
 
        contains: update(function (className, valArr) {
          if (valArr.length === 0) throw TypeError("Failed to execute 'contains' on 'DOMTokenList': 1 argument required, but only 0 present.")
          if (typeof valArr[0] !== 'string' || !!~valArr[0].search(/\s+/g)) return false
          return !!~className.search(new RegExp(valArr[0]))
        }),
 
        item: function (index) {
          typeof index === 'string' ? index = parseInt(index) : ''
          if (arguments.length === 0 || typeof index !== 'number') throw TypeError("Failed to execute 'toggle' on 'DOMTokenList': 1 argument required, but only 0 present.")
          var claArr = self.className.replace(/^\s+|\s+$/, '').split(/\s+/)
          var len = claArr.length
          if (index < 0 || index >= len) return null
          return claArr[index]
        }
      }
    }
  })
}
