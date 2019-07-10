owo:  一个高效、易用、干净的html框架

### 1. 项目特点

1. 所有dom元素都不是虚拟的，完美兼容传统MVC框架，且对搜索引擎友好。
2. 内置将一个页面分离成多个组件，组件可以方便的移植到其他项目中使用,支持加载远程地址组件。
3. 支持使用less, sass, pug等写法(需要安装对应插件),能够自动将支持性不友好的js、css代码转换为兼容各个浏览器的代码。
4. 框架在各种浏览器乃至IE8版本以下浏览器均能使用。
5. 支持资源统一管理，自动处理html、css、js中的资源引用，支持无损压缩图片输出等功能。
6. 框架能够进行智能分析，对框架中没有使用到的方法不会打包到项目工程里，真正做到干净。
7. 内置路由系统，内置数十种页面切换效果，可以方便的制作SPA页面。
8. 内置多种内置方法，并支持扩展。
9. 支持对js,css进行美化输出
10. 支持slot插槽
11. 支持event监听事件,$emit发送事件


### [更新历史](./history.md)

### TODO
1. svg中存在style会有样式异常
2. 目前还需要自己指定返回动画

### 待修复
2. 一次修改多个文件会造成打包多次
### 2. 快速上手

安装
```
npm i -g @owo/owo
```
创建示例项目
```
owo init test
```
打开示例文件夹
```
cd test
```
安装依赖包
```
npm i 或 yarn
```
运行或者编译
```
owo dev 或者 owo build
```

### 3. 内置方法

1. $go - 跳转到其他页面

| 参数        | 含义        | 类型   |  必须  |
| ----------- |:-------------:| -----:| -----:|
| pageName     | 页面名称 |   string     |   是     |
| in        |   页面入场动画   |   string   |   否     |
| out        |    页面离开动画    |  string  |   否     |


### 4. 其他
### 1.getPopPosition

```
/**
 * 智能计算弹窗合适出现的位置
 * @param  {number} areaW 区域的宽度
 * @param  {number} areaH 区域的高度
 * @param  {number} boxW  弹窗的高度
 * @param  {number} boxH  弹窗的高度
 * @param  {number} x     出现点的X轴坐标
 * @param  {number} y     出现点的Y轴坐标
 * @return {object} 返回合适的位置信息
 */
```

### 2.getScreenInfo

```
/**
 * 获取屏幕信息
 * @return {object} 屏幕信息
 */
```

### 3.smoothChange

```
/**
 * 平滑的改变值
 * @param  {number} startValue 初始数值
 * @param  {number} endValue   结束数值
 * @param  {number} time       持续次数
 * @param  {number} step       步长
 * @param  {function} callBack 回调函数
 * @return {object}            控制信息
 */
```

### 4.toast

```
/**
 * 显示toast提示
 * @param  {number} text       显示的文字
 * @param  {number} time       显示时长
 */
```

### 5.getQueryString

/**
 * 获取URL参数中字段的值
 * @param  {string} name 参数名称
 * @return {string} 返回参数值
 */