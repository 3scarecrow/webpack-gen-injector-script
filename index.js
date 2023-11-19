const fs = require('fs')
const path = require('path')
const HtmlWebpackPlugin = require("html-webpack-plugin")

const injectorTemplate = `
;(function() {
  var headTags = <%= headTags %>;
  var bodyTags = <%= bodyTags %>;

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
`

/**
 * 获取输出文件的路径
 * 
 * @param {Object} compilation - 用于处理编译信息的对象
 * @param {Object} config - 配置对象
 * @returns {string} - 输出文件的路径
 */
function getOutputPath(compilation, config) {
  return path.resolve(compilation.options.output.path, config.filename)
}

/**
 * 生成注入数据
 * @param {object} data - 数据对象
 * @returns {object} - 包含headTags和bodyTags的注入数据对象
 */
function genInjectorData(data) {
  if (data.assetTags) {
    return {
      headTags: JSON.stringify(data.assetTags.styles),
      bodyTags: JSON.stringify(data.assetTags.scripts)
    }
  }
  return {
    headTags: JSON.stringify(data.head),
    bodyTags: JSON.stringify(data.body)
  }
}

/**
 * 编译模板，并根据传入的数据返回处理后的模板。
 * @param {string} template - 待编译的模板字符串。
 * @param {object} data - 包含数据的对象。
 * @returns {string} 处理后的模板字符串。
 */
function compiledTemplate(template, data) {
  return template.replace(/<%=([^%>]+)?%>/g, function (_, key) {
    return data[key.trim()] || ''
  })
}

/**
 * 写入注入脚本
 * @param {string} filePath - 脚本文件的路径
 * @param {Object} injectorData - 注入脚本的数据
 */
function writeInjectorScript(filePath, injectorData) {
  const injectorContent = compiledTemplate(injectorTemplate, injectorData)
  fs.writeFileSync(filePath, injectorContent)
}

class WebpackGenInjectorScript {
  constructor(options = {}) {
    const defaultOptions = {
      filename: 'injector.js'
    }
    this.config = Object.assign(defaultOptions, options)
  }

  apply(compiler) {
    // HtmlWebpackPlugin version 4.0.0开始支持hooks
    if (HtmlWebpackPlugin && HtmlWebpackPlugin.getHooks) {
      compiler.hooks.compilation.tap('WebpackGenInjectorScript', (compilation) => {
        const compilationHooks = HtmlWebpackPlugin.getHooks(compilation)
        compilationHooks.alterAssetTags.tap('WebpackGenInjectorScript', (data) => {
            const filePath = getOutputPath(compilation, this.config)
            const injectorData = genInjectorData(data)

            compiler.hooks.afterDone.tap('WebpackGenInjectorScript', () => {
              writeInjectorScript(filePath, injectorData)
            })
          }
        )
      })
    } else {
      // HtmlWebpackPlugin version 3.2.0
        compiler.plugin('compilation', (compilation) => {
          compilation.plugin('html-webpack-plugin-alter-asset-tags', (data) => {
            const filePath = getOutputPath(compilation, this.config)
            const injectorData = genInjectorData(data)
    
            compiler.plugin('done', () => {
              writeInjectorScript(filePath, injectorData)
            })
          })
        })
    }
  }
}

module.exports = WebpackGenInjectorScript