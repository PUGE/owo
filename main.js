const Templet = require('./lib/templet')
const fs = require('fs')


// 读取模板文件
// 将整个文件一次性读取到内存中
const templet = fs.readFileSync('./index.html', 'utf8');
console.log(Templet.cutString("sdsdsddddddddd", "s", "ddddd"))