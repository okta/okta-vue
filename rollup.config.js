import vue from 'rollup-plugin-vue'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'
import cleanup from 'rollup-plugin-cleanup'
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

const commonPlugins = [
  replace({
    PACKAGE: JSON.stringify(ENV.packageInfo)
  }),
  cleanup()
]

export default [
  {
    input: 'src/okta-vue.js',
    plugins: [
      vue(),
      babel({
        babelrc: false,
        babelHelpers: 'bundled',
        presets: ['@babel/preset-env']
      }),
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
        '@okta/okta-auth-js': 'OktaAuth'
      }
    }
  },
  {
    input: 'src/okta-vue.js',
    external: makeExternalPredicate(external),
    plugins: [
      vue(),
      babel({
        babelHelpers: 'runtime',
        presets: ['@babel/preset-env'],
        plugins: ['@babel/plugin-transform-runtime']
      }),
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
