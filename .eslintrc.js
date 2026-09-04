// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  env: {
    node: true,
    es6: true
  },
  extends: [
    'eslint:recommended',
  ],
  overrides: [
    {
      // Jest specs, and the test doubles they share
      files: [
        '**/test/specs/**/*.spec.{j,t}s?(x)',
        '**/test/mocks/**/*.{j,t}s?(x)'
      ],
      env: {
        jest: true,
        // These run under jsdom, so window/document/URL are available.
        browser: true,
        es6: true
      },
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020
      },
    },
    {
      // rollup.config.js
      files: ['rollup.config.js'],
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020
      },
      env: {
        node: true
      }
    },
    {
      // e2e test
      files: ['**/test/e2e/**/*.{j,t}s?(x)'],
      env: {
        browser: true
      }
    }
  ]
};