# 工具启动原理

------

## 1. 首先工具会尝试从当前目录下的owo.js文件中读取配置信息


## 2. 配置文件读取成功后会读取配置中的pageList属性开始生成页面
> pageList类型为一个数组，其中的每一项都会被框架当成一个“页面”解析
> 每一条“页面”数据均包含 表示页面名称的name属性 以及表示模块文件相对位置的src属性、
> 配置中的entry代表入口页面为哪一个页面

```
module.exports = {
    // 项目入口文件
    entry: "home",
    // 页面清单
    pageList: [
        {
          name: 'home',
          src: './src/page/home.page'
        },
        {
          name: 'name',
          src: './src/page/name.page',
          // 页面也可以传参数
          prop: {
            text: '样式隔离:组件与组件之间的样式不会相互影响'
          }
        },
        {
          name: 'animation',
          src: './src/page/animation.page'
        }
    ]
}
```

## 3. 紧接着框架会对页面文件进行分析
> 页面文件和模块文件写法格式是一样的，但是只有在pageList中声明的会被当作页面处理

一般的页面/模块文件格式为:

```
<template>
  <temple name="titleBar" src="https://owo.ink/public/8b2a5bb5645c82458e8d3a71d58cd42d.page"></temple>
  <div class="example">{{prop.text}}</div>
</template>

<script>
  module.exports = {
    created: function () {
      console.log('my name is pack!')
    }
  }
</script>


<style>
  .example {
    height: 50px;
    width: 400px;
    line-height: 50px;
    text-align: center;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    margin: auto;
    font-size: 2rem;
  }
  a {
    background-color: #009fe9;
    color: white;
    padding: 5px;
    font-size: 13px;
    line-height: 40px;
    border-radius: 5px;
  }
</style>
```

> 其中使用<template></template>包裹的可以理解为普通html

> 其中使用<script></script>包裹的部分与普通js的书写方式稍有差别（经过框架封装以自动实现某些功能，稍后详细介绍）

> 其中使用<script></script>包裹的的可以理解为普通css,但是与常规css区别是：每个模块的样式互不影响，只会对自己和自己的模块起作用（全局生效的样式写法后面讲解）

## 3. 框架在取到页面文件内容后首先会开始解析html内容（<template></template>包裹部分）
框架的template解析程序会对html中的特殊写法做特殊解析以方便实现各种功能，下面以3中最常见的特殊写法做说明

### 1. 模块标签 ---- <temple></temple>
```
<template>
  <!-- 本地模块 -->
  <temple name="button" src="./src/module/button.owo"></temple>
  <!-- 网络模块 -->
  <temple name="titleBar" src="https://owo.ink/public/8b2a5bb5645c82458e8d3a71d58cd42d.page"></temple>
  <div class="example">{{prop.text}}</div>
</template>
```

> temple标签在普通html中并无意义，但是在此框架中代表模块引用，其中属性name表示模块名，src表示模块路径/位置，src属性可以是本地路径也可以是一个网络路径

### 2. 事件监听 ---- @

```
<template>
  <div @click="hide" class="show-image">
    <img src=""/>
  </div>
</template>

<script>
module.exports = {
  hide: function () {
    this.$el.style.display = 'none'
    window.history.go(-1)
  }
}
</script>

```

> 当框架template解析程序解析到一个dom节点有一个属性是以@开头时，便会自动监听此dom节点的对应事件，并执行相应的方法

> 示例中的@click="hide"就表示当div被点击时执行当前模块<script>中的hide方法 （在实际中执行的方法不限于当前script中的方法，但是通常绝大多数使用场景时是这样的）

### 3. 资源调用 ---- @&资源文件名&
```
<template>
  <div class="show-image">
    <img src="@&test.png&"/>
  </div>
</template>
```
> 如示例所示 img标签的地址在框架中可以写成 @&资源文件名& 的形式，使用者不需要考虑资源文件相对与页面的位置，只需要将文件放置在资源目录中(owo.js中配置)，框架会自动对资源做优化处理并替换标签为真实路径

