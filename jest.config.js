const pkg = require('./package.json');

const packageInfo = {
  name: pkg.name,
  version: pkg.version
};

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
    'PACKAGE': packageInfo,
    'AUTH_JS': { minSupportedVersion: '5.3.1' }
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
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: { warnOnly: true } }],
    '^.+\\.m?jsx?$': 'babel-jest',
    '.*\\.(vue)$': '@vue/vue3-jest'
  },
  transformIgnorePatterns: [
    // Not a mangled "diagnostics": `nostics` is a real package (vercel-labs), pulled in as an
    // ESM-only transitive dependency of vue-router 5. Jest has to transform it.
    '/node_modules/(?!(nostics)/)'
  ],
  moduleNameMapper: {
    // `@okta/spa-platform` is ESM-only and node_modules stays untransformed (see
    // transformIgnorePatterns above), so requiring the real package from a spec throws
    // ERR_REQUIRE_ESM. src/client-js/ imports exactly two values from it; the stub provides both.
    '^@okta/spa-platform$': '<rootDir>/test/mocks/spa-platform.js'
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    './test/jest.setup.js'
  ],
}
