function Page(pageScript, parentScript) {
  for (const key in pageScript) {
    this[key] = pageScript[key]
  }
  /* if="this.plugList.has('special_data')" */
  if (typeof this.data === 'function') {
    this.data = this.data()
  }
  /* end="this.plugList.has('special_data')" */
  // 处理页面引用的模板
  for (var key in pageScript.template) {
    pageScript.template[key].$el = pageScript.$el.querySelector('[template="' + key + '"]')
    pageScript.template[key] = new Page(pageScript.template[key])
  }
  if (parentScript) {
    this._parent = parentScript
  }
}

Page.prototype.owoPageInit = owoPageInit
Page.prototype.handleEvent = handleEvent