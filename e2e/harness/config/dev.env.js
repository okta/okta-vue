'use strict'

const merge = require('webpack-merge')
const prodEnv = require('./prod.env')
const CONFIG = require('../../../env')().spaConstants

module.exports = merge(prodEnv, CONFIG, {
  NODE_ENV: '"development"'
})
