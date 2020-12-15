// // https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  env: {
    node: true,
    es6: true
  },
  extends: [
    'eslint:recommended',
  ],
  overrides: [
    {
      // Jest
      files: ['**/test/specs/**/*.spec.{j,t}s?(x)'],
      env: {
        jest: true,
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