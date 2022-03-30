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
    'AUTH_JS': { minSupportedVersion: '5.3.1' },
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
    '.*\\.(vue)$': 'vue3-jest'
  },
  testEnvironment: 'jsdom'
}
