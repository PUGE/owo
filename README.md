### 1. 框架特点

1. 页面中的dom都是真实存在的，并非通过js(vue等框架)。 优点: 便于搜索引擎抓取,浏览器可以在解析执行js前对html结构进行分析显示。
2. 支持组件化(类似vue等框架),但简化了载入方式，支持网络组件加载，有在线组件库。
3. 支持安装使用lass,sass,pug等插件，内置bable，代码美化，图片压缩等插件。
4. IE8 Support。
5. 特有的资源管理功能，使资源引入更为简单。
6. 真正落实按需引入,打包生成的代码每一行都是项目中实际需要的，不需要的方法样式会被剔除。 例如：如果页面中没有使用到路由，和路由以及页面切换相关的代码将不会打包在编译版本中。
7. 内置路由系统，方便的切换页面并增加切换动画。
8. 支持扩展，解决方案。


### [更新历史](./history.md)


### TODO
1. svg中存在style会有样式异常
2. 一次修改多个文件会造成打包多次

### 2. 快速上手

安装
```
npm i -g @owo/owo
```

### 3. 内置方法

1. owo.go - 跳转到其他页面

| 参数        | 含义        | 类型   |  必须  |
| ----------- |:-------------:| -----:| -----:|
| pageName     | 页面名称 |   string     |   是     |
| in        |   页面入场动画   |   string   |   否     |
| out        |    页面离开动画    |  string  |   否     |
| backIn        |   页面返回入场动画   |   string   |   否     |
| backOut        |    页面返回离开动画    |  string  |   否     |
| noBack        |   是否不需要返回    |  string  |   否     |

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
