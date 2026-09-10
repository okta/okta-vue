'use strict'

const shell = require('shelljs')
const chalk = require('chalk')
const fs = require('fs')

const NPM_DIR = `dist`
const BUNDLE_CMD = `yarn bundle`
const BANNER_CMD = `yarn banners`
const BUNDLES_DIR = `${NPM_DIR}/bundles`

shell.echo(`Start building...`)

shell.rm(`-Rf`, `${NPM_DIR}/*`)
shell.mkdir(`-p`, `./${BUNDLES_DIR}`)

// Bundle using webpack
if (shell.exec(BUNDLE_CMD).code !== 0) {
  shell.echo(chalk.red(`Error: Rollup failed`))
  shell.exit(1)
}

// Maintain banners
if (shell.exec(BANNER_CMD).code !== 0) {
  shell.echo(chalk.red(`Error: Maintain banners failed`))
  shell.exit(1)
}

shell.echo(chalk.green(`Bundling completed`))

shell.cp(`-Rf`, [`src`, `package.json`, `LICENSE`, `THIRD-PARTY-NOTICES`, `*.md`], `${NPM_DIR}`)

shell.echo(`Modifying final package.json`)
const packageJSON = JSON.parse(fs.readFileSync(`./${NPM_DIR}/package.json`))
packageJSON.private = false
packageJSON.scripts.prepare = '';

// Remove "dist/" from the entrypoint paths.
['main', 'module', 'types'].forEach(function (key) {
  if (packageJSON[key]) {
    packageJSON[key] = packageJSON[key].replace('dist/', '')
  }
})

// ...and from every path in the subpath `exports` map, which nests one or two levels deep.
const stripDist = value => typeof value === 'string'
  ? value.replace('dist/', '')
  : Object.fromEntries(Object.entries(value).map(([key, val]) => [key, stripDist(val)]))

if (packageJSON.exports) {
  packageJSON.exports = stripDist(packageJSON.exports)
}

fs.writeFileSync(`./${NPM_DIR}/package.json`, JSON.stringify(packageJSON, null, 4))

// Resolvers that predate `exports` (TypeScript's `moduleResolution: "node"`, older bundlers) ignore
// the map above entirely, and would report `@okta/okta-vue/client-js` as unresolvable. A stub
// directory with its own package.json makes the subpath resolvable the old way too. No `main`: the
// bundle is ESM-only, see rollup.config.js.
shell.echo(`Writing ${NPM_DIR}/client-js resolution stub`)
shell.mkdir(`-p`, `./${NPM_DIR}/client-js`)
fs.writeFileSync(`./${NPM_DIR}/client-js/package.json`, JSON.stringify({
  module: '../bundles/okta-vue-client-js.esm.js',
  types: '../bundles/types/client-js/index.d.ts'
}, null, 4))

shell.echo(chalk.green(`End building`))
