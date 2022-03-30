const presets = []
const plugins = []

if (process.env.NODE_ENV === 'test') {
  // Convert to commonJS when running in jest
  presets.unshift(['@babel/preset-env', {
    modules: 'commonjs'
  }])
  plugins.unshift(['@babel/transform-runtime'])
}

module.exports = { presets, plugins }
