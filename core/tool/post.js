/**
 * 发送post请求
 * @param  {string} url       服务器地址
 * @param  {string} data       发送的数据
 * @param  {function} fn       回调函数
 */

owo.tool.post = function (url, data, fn) {
  var xmlhttp = null
  if (window.XMLHttpRequest) {
    xmlhttp = new XMLHttpRequest()
  }
  xmlhttp.open("POST", url, true)
  xmlhttp.setRequestHeader("Content-Type", "application/json")     
  xmlhttp.timeout = 4000
  xmlhttp.onreadystatechange = function () { 
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 504 ) {
        console.log("服务器请求超时..");
        xmlhttp.abort();
      } else if(xmlhttp.status == 200){
        fn(xmlhttp.responseText);  
      }
      xmlhttp = null;
    }
  }
  xmlhttp.ontimeout = function () {
    console.log("客户端请求超时..");
  }
  if (typeof data != 'string') data = JSON.stringify(data)
  xmlhttp.send(data);
}