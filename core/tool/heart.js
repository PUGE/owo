owo.tool.heart = function (dom, callBack) {
  function showHeart (e) {
    var x = e.touches ? e.touches[0].pageX : e.pageX;
    var y = e.touches ? e.touches[0].pageY: e.pageY;
    var star = document.createElement("div");
    star.innerHTML = '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2122"><path d="M753.266187 77.352518A270.218129 270.218129 0 0 0 512 230.510504 270.218129 270.218129 0 0 0 270.733813 77.352518C121.480288 77.352518 0 203.105612 0 357.663309c0 240.750504 257.841727 460.431655 498.444892 585.669065a29.467626 29.467626 0 0 0 27.110216 0c240.971511-125.23741 498.444892-344.918561 498.444892-585.669065 0-154.557698-121.480288-280.310791-270.733813-280.310791z" fill="#a11f1b" p-id="2123"></path></svg>';
    var RandomSize = parseInt(Math.random() * 20 + 20);
    star.style.height = star.style.width = RandomSize + "px";
    star.style.color = "red";
    star.style.pointerEvents = 'none'
    star.style.width = RandomSize + "px";
    star.style.position = "absolute";
    x = x - (RandomSize / 2)
    y = y - (RandomSize / 2)
    star.style.left = x + "px";
    star.style.top = y + "px";
    document.body.appendChild(star);
    var op = 100;
    var deg = 0;
    var RandomX = Math.round(Math.random() * 2 + 2);
    var t = setInterval(function(){
      op--;
      deg +=5;
      star.style.top = (star.offsetTop-=RandomX) + "px";
      star.style.left = 20 * Math.sin(deg * Math.PI / 180) + x + "px";
      star.style.opacity = op / 100;
      if (star.style.opacity == 0) {
        clearInterval(t);
        star.remove();
      }
    }, 20)
    if (callBack) callBack()
  }
  if (_owo.isMobi) {
    dom.ontouchstart = showHeart
  } else {
    dom.onclick = showHeart
  }
}