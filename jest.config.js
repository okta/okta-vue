var ENV = require('./env')()

module.exports = {
  'globals': {
    'PACKAGE': ENV.packageInfo
  },
  'restoreMocks': true,
  'moduleFileExtensions': [
    'js',
    'json',
    'vue'
  ],
  'transform': {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
    '.*\\.(vue)$': '<rootDir>/node_modules/vue-jest'
  },
  'moduleNameMapper': {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  'roots': [
    'test/specs'
  ],
  'testEnvironment': 'jsdom'
}
