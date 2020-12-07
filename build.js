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
let packageJSON = JSON.parse(fs.readFileSync(`./${NPM_DIR}/package.json`))
packageJSON.private = false
packageJSON.scripts.prepare = '';

// Remove "dist/" from the entrypoint paths.
['main', 'module'].forEach(function (key) {
  if (packageJSON[key]) {
    packageJSON[key] = packageJSON[key].replace('dist/', '')
  }
})

fs.writeFileSync(`./${NPM_DIR}/package.json`, JSON.stringify(packageJSON, null, 4))

shell.echo(chalk.green(`End building`))
