const CONFIG = require('../../env')().spaConstants

module.exports = {
  chainWebpack: config => {
    config.plugin('define').tap(definitions => {
      definitions[0] = Object.assign(definitions[0], {
        CONFIG: JSON.stringify(CONFIG)
      })
      return definitions
    })
  }
}
