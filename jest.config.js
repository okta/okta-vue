var ENV = require('./env')()

module.exports = {
  coverageDirectory: '<rootDir>/test-reports/unit',
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**',
    '!./test/**'
  ],
  reporters: [
    'default',
    'jest-junit'
  ],
  globals: {
    'PACKAGE': ENV.packageInfo,
    'ts-jest': {
      diagnostics: {
        warnOnly: true
      }
    }
  },
  restoreMocks: true,
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
    'json',
    'vue'
  ],
  testMatch: [
    '**/test/specs/**/*.spec.[jt]s?(x)'
  ],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
    '.*\\.(vue)$': 'vue-jest'
  },
  testEnvironment: 'jsdom'
}
