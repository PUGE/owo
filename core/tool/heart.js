owo.tool.heart = function (dom, callBack) {
  dom.ontouchstart = function (e) {
    var x = e.touches[0].pageX;
    var y = e.touches[0].pageY;
    var star = document.createElement("div");
    star.innerHTML = '<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M550.4 947.2c-21.333333 17.066667-53.333333 17.066667-74.666667 0C360.533333 864 21.333333 595.2 21.333333 366.933333c0-42.666667 4.266667-72.533333 14.933334-93.866666C74.666667 151.466667 187.733333 64 320 64c66.133333 0 128 23.466667 179.2 59.733333 8.533333 6.4 19.2 6.4 25.6 0C576 87.466667 637.866667 64 704 64c132.266667 0 243.2 87.466667 283.733333 209.066667 10.666667 21.333333 14.933333 53.333333 14.933334 96 0 226.133333-339.2 494.933333-452.266667 578.133333zM332.8 544C198.4 462.933333 213.333333 332.8 213.333333 326.4c2.133333-12.8-6.4-23.466667-17.066666-23.466667-10.666667-2.133333-23.466667 6.4-23.466667 19.2 0 6.4-21.333333 162.133333 138.666667 260.266667 4.266667 2.133333 6.4 2.133333 10.666666 2.133333 6.4 0 14.933333-4.266667 19.2-10.666666 4.266667-10.666667 0-23.466667-8.533333-29.866667z" fill="#d81e06" p-id="2773"></path></svg>';
    var RandomSize = parseInt(Math.random() * 40 + 20);
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
}