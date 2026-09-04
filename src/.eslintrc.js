// Packages that make up `@okta/okta-client-javascript`. They are *optional* peer dependencies:
// only consumers who import `@okta/okta-vue/client-js` are expected to have them installed, so the
// default entry point must never reach them — not even through a type-only import, which would put
// them in the published `.d.ts` and break `tsc` for everyone else.
const CLIENT_JS_PACKAGES = [
  '@okta/auth-foundation',
  '@okta/auth-foundation/*',
  '@okta/oauth2-flows',
  '@okta/oauth2-flows/*',
  '@okta/spa-platform',
  '@okta/spa-platform/*'
];

module.exports = {
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaVersion: 2020,
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  plugins: [
    // https://github.com/import-js/eslint-plugin-import#typescript
    'import',
  ],
  rules: {
    // https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md
    'import/no-extraneous-dependencies': ['error', {
      'devDependencies': false
    }]
  },
  settings: {
    // https://github.com/import-js/eslint-plugin-import#typescript
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts']
    }
  },
  overrides: [
    {
      // Everything in the default `src/index.ts` bundle. Keeps `@okta/okta-vue` installable and
      // buildable with `@okta/okta-auth-js` alone.
      files: ['**/*.{ts,js,vue}'],
      excludedFiles: ['client-js/**'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: CLIENT_JS_PACKAGES,
              message:
                '@okta/okta-client-javascript packages are optional peer dependencies and must stay ' +
                'behind the `@okta/okta-vue/client-js` subpath. Put this code in src/client-js/ instead.'
            },
            {
              group: ['**/client-js', '**/client-js/**'],
              message:
                'The default entry point must not import from src/client-js/ — doing so would pull the ' +
                'optional @okta/okta-client-javascript peer dependencies into the default bundle.'
            }
          ]
        }]
      }
    },
    {
      // The opt-in subpath. `@okta/okta-auth-js` is the *other* SDK: mixing the two in one module
      // would defeat the point of keeping them separable.
      files: ['client-js/**/*.{ts,js,vue}'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['@okta/okta-auth-js', '@okta/okta-auth-js/*'],
              message:
                'src/client-js/ is the @okta/okta-client-javascript path and must not depend on ' +
                '@okta/okta-auth-js.'
            }
          ]
        }]
      }
    }
  ]
};
