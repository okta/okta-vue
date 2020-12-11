/* eslint-disable no-console */
const spawn = require('cross-spawn-with-kill')
const waitOn = require('wait-on')

// 1. start the dev server
const server = spawn('yarn', [
  '--cwd',
  '../app',
  'start'
], { stdio: 'inherit' })

waitOn({
  resources: [
    'http-get://localhost:8080'
  ]
}).then(() => {
  // 2. run the nightwatch test suite against it
  // to run in additional browsers:
  //    1. add an entry in test/e2e/nightwatch.conf.json under "test_settings"
  //    2. add it to the --env flag below
  // or override the environment flag, for example: `npm run e2e -- --env chrome,firefox`
  // For more information on Nightwatch's config file, see
  // http://nightwatchjs.org/guide#settings-file
  let opts = process.argv.slice(2)
  if (opts.indexOf('--config') === -1) {
    opts = opts.concat(['--config', 'nightwatch.conf.js'])
  }
  if (opts.indexOf('--env') === -1) {
    opts = opts.concat(['--env', 'chrome'])
  }

  const runner = spawn('./node_modules/.bin/nightwatch', opts, { stdio: 'inherit' })

  let returnCode = 1
  runner.on('exit', function (code) {
    console.log('Test runner exited with code: ' + code)
    returnCode = code
    server.kill()
  })
  runner.on('error', function (err) {
    server.kill()
    throw err
  })
  server.on('exit', function (code) {
    console.log('Server exited with code: ' + code)
    // eslint-disable-next-line no-process-exit
    process.exit(returnCode)
  })
})
