# webpack-gen-injector-script

一个基于 HtmlWebpackPlugin 生成资源注入脚本的插件

## 适用场景

该插件适用于当其他的项目需要引入我们项目打包的资源的场景，其他的项目要引入就需要手动引入，并且我们的项目每次更新，其他的项目都需要手动修改文件的 hash 值，容易出现漏改、错改问题，比如引入如下：

```html
<head>
  <link href="/css/app.b2d625b8.css" rel="stylesheet">
  <script defer="true" src="/js/chunk-vendors.af90723c.js"></script>
  <script defer="true" src="/js/app.cbe82b42.js"></script>
</head>
```

使用插件后就可以只需引入注入脚本，自动加载其他的资源，其中 url 为 injector.js 的资源地址，并通过版本号避免缓存

```js
(function() {
  var script = document.createElement("script")
  var timestamp = Math.floor(new Date().getTime() / (60 * 1000)) // 时间戳按分钟取整
  script.src = url + '?v=' + timestamp
  document.head.appendChild(script)
})()
```

## 执行结果

使用插件打包后会在 dist 目录输出 injector.js 文件，引入该文件即可加载打包后的所有资源

```js
// dist/injector.js
;(function() {
  var headTags = [{"tagName":"link","voidTag":true,"meta":{"plugin":"html-webpack-plugin"},"attributes":{"href":"/css/app.b2d625b8.css","rel":"stylesheet"}}];
  var bodyTags = [{"tagName":"script","attributes":{"defer":true,"src":"/js/chunk-vendors.af90723c.js"}},{"tagName":"script","attributes":{"defer":true,"src":"/js/app.cbe82b42.js"}}];

  headTags.forEach(function(tag) {
    document.head.appendChild(createResource(tag))
  })

  bodyTags.forEach(function(tag) {
    document.body.appendChild(createResource(tag))
  })

  function createResource(source) {
    var tagName = source.tagName
    var attributes = source.attributes
    var element = document.createElement(tagName)
    for (var attr in attributes) {
      element.setAttribute(attr, attributes[attr])
    }
    return element
  }
})()
```

## 安装

```sh
yarn add @3scarecrow/webpack-gen-injector-script

# or

npm install @3scarecrow/webpack-gen-injector-script
```