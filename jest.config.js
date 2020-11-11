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
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@okta/okta-auth-js$': '<rootDir>/node_modules/@okta/okta-auth-js/dist/okta-auth-js.umd.js'
  },
  'roots': [
    'test/specs'
  ],
  'testEnvironment': 'jsdom'
}
