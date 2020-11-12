import vue from 'rollup-plugin-vue'
import babel from '@rollup/plugin-babel'
import replace from '@rollup/plugin-replace'
import { terser } from 'rollup-plugin-terser'

const ENV = require('./env')()

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
      replace({
        PACKAGE: JSON.stringify(ENV.packageInfo)
      }),
      terser()
    ],
    external: ['@okta/okta-auth-js'],
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
    external: ['@okta/okta-auth-js'],
    plugins: [
      vue(),
      babel({
        babelHelpers: 'runtime',
        presets: ['@babel/preset-env'],
        plugins: ['@babel/plugin-transform-runtime']
      }),
      replace({
        PACKAGE: JSON.stringify(ENV.packageInfo)
      })
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
