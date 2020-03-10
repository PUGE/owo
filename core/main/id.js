/* if="this.plugList.includes('id')" */
// 计算$dom
var idList = document.querySelectorAll('[id]')
owo.id = {}
for (var ind = 0; ind < idList.length; ind++) {
  var item = idList[ind]
  owo.id[item.getAttribute('id')] = item
}
/* end="this.plugList.includes('id')" */