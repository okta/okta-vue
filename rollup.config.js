import vue from 'rollup-plugin-vue'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'
import cleanup from 'rollup-plugin-cleanup'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'

const ENV = require('./env')()

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
    PACKAGE: JSON.stringify(ENV.packageInfo),
    AUTH_JS: JSON.stringify({
      minSupportedVersion: '5.3.1'
    })
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
        'vue': 'Vue'
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
