/* if="this.plugList.includes('id')" */
// 计算$dom
for(var page in owo.script) {
  var idList = document.querySelectorAll('.page[template="' + page + '"] [id]')
  owo.id = {}
  for (var ind = 0; ind < idList.length; ind++) {
    owo.id[idList[ind].getAttribute('id')] = idList[ind]
  }
}
/* end */