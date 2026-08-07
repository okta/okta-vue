import vue from 'rollup-plugin-vue'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'
import cleanup from 'rollup-plugin-cleanup'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json' with { type: 'json' }

const packageInfo = {
  name: pkg.name,
  version: pkg.version
};

const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {})
]

const makeExternalPredicate = externalArr => {
  if (externalArr.length === 0) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return id => pattern.test(id)
}

const input = 'src/index.ts'

const commonPlugins = [
  commonjs(),
  replace({
    values: {
      PACKAGE: JSON.stringify(packageInfo),
      AUTH_JS: JSON.stringify({
        minSupportedVersion: '5.3.1'
      })
    },
    preventAssignment: true,
    // default delimiters (as of v5+) exclude matches followed by `.`, but PACKAGE/AUTH_JS
    // are only ever referenced via property access (e.g. PACKAGE.name), so that guard
    // must be dropped or these replacements never fire.
    delimiters: ['(?<![_$a-zA-Z0-9\\xA0-\\uFFFF])', '(?![_$a-zA-Z0-9\\xA0-\\uFFFF])']
  }),
  cleanup()
]

export default [
  {
    input,
    plugins: [
      typescript({
        typescript: require('typescript'),
        useTsconfigDeclarationDir: true
      }),
      vue(),
      ...commonPlugins,
      terser()
    ],
    external: makeExternalPredicate(external),
    output: {
      format: 'umd',
      file: 'dist/bundles/okta-vue.umd.js',
      sourcemap: true,
      name: 'OktaVue',
      exports: 'named',
      globals: {
        '@okta/okta-auth-js': 'OktaAuth',
        'vue': 'Vue',
        'compare-versions': 'compareVersions'
      }
    }
  },
  {
    input,
    external: makeExternalPredicate(external),
    plugins: [
      typescript({
        typescript: require('typescript'),
        useTsconfigDeclarationDir: true
      }),
      vue(),
      ...commonPlugins
    ],
    output: [
      {
        format: 'cjs',
        file: 'dist/bundles/okta-vue.cjs.js',
        exports: 'named',
        sourcemap: true
      },
      {
        format: 'esm',
        file: 'dist/bundles/okta-vue.esm.js',
        exports: 'named',
        sourcemap: true
      }
    ]
  }
]
