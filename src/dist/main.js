window.ozzx={script:{}};var globalConfig={entry:"home"};function getarg(o){return arg=o.split("#"),arg[1]}function pgNameHandler(o){for(var e=0;e<o.children.length;e++){var t=o.children[e],n=t.attributes["@name"];n&&(console.log(n.textContent),window.ozzx.domList[n.textContent]=t);var a=t.attributes["@click"];if(a){var i=a.textContent;t.onclick=function(){var o=window.ozzx.script[window.ozzx.activePage],e=i.match(/[^\(\)]+(?=\))/g)[0],n=e.split(",");i=i.replace("("+e+")",""),o.methods[i]&&o.methods[i].apply({$el:t,activePage:window.ozzx.activePage,domList:window.ozzx.domList,data:window.ozzx.script[window.ozzx.activePage].data,methods:window.ozzx.script[window.ozzx.activePage].methods},n)}}0<t.children.length&&pgNameHandler(t)}}function runPageFunction(o,e){window.ozzx.domList={},pgNameHandler(e);var n=window.ozzx.script[o];n&&n.created.apply(window.ozzx)}window.onload=function(){var o=getarg(window.location.href),e=o||globalConfig.entry;if(e){var n=document.getElementById("ox-"+e);n?(n.style.display="block",runPageFunction(window.ozzx.activePage=e,n)):console.error("入口文件设置错误!")}else console.error("未设置程序入口!")},window.onhashchange=function(o){var e=getarg(o.oldURL),n=getarg(o.newURL);void 0===e&&(e=globalConfig.entry);var t=document.getElementById("ox-"+e);t&&(t.style.display="none");var a=document.getElementById("ox-"+n);a?(a.style.display="block",runPageFunction(window.ozzx.activePage=n,entryDom)):console.error("页面不存在!")},window.ozzx.script={home:{data:{nameList:{rank1:{name:"lis",like:"orange"},rank2:{name:"kim",like:"yellow"},rank3:{name:"tony",like:"white"}}},created:function(){console.log("hellow word!")},methods:{showAlert:function(o,e){console.log(_this),alert("Hellow "+o+", My name is "+e)}}},name:{created:function(){console.log("my name is pack!")}}};