安装方法

```
npm i -g ozzx
```

下载并解压示例:

git clone https://github.com/ozzx/example

打开目录:

cd example

安装依赖

npm i
或
yarn

开始打包

pack

进度列表:

* 支持打包成Html                                                √
* 支持分页                                                      √
* 支持模板拆分                                                  √
* 支持methods                                                  √
* 支持data                                                      √
* 支持created事件                                               √
* 支持各个页面样式互不影响                                       √
* 支持onclick事件                                               √
* 文件变动检测                                                   √
* 支持压缩css                                                   √
* 支持压缩js                                                    √
* 支持sass                                                      √
* 支持less                                                      √
* 兼容IE8浏览器                                                  √
* 支持按需打包                                                   √
* 支持加载网络模板                                               √
* 支持页面切换效果(几十种切换效果)                                 √
* 支持对js进行美化                                                √
* 支持对css进行美化                                               √
* 内置扩展方法(getPopPosition, smoothChange)                                    √
* 支持异步打包                                                    √
* 支持自动刷新                                                    √
* 输出文件支持自动加版本号                                         √
* 输出文件支持自动加更新时间                                       √
* 支持通过一个配置文件自定义多个打包配置                             √
* 支持自定义指定样式的useAnimationList属性
* 支持循环嵌套
* 网络模板名问题


## tool

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