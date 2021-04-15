const { spaConstants } = require('../../env')()

// http://nightwatchjs.org/gettingstarted#settings-file
module.exports = {
  src_folders: ['./specs'],
  output_folder: '../../test-reports/e2e',
  custom_assertions_path: ['./custom-assertions'],

  selenium: {
    start_process: true,
    server_path: '../../node_modules/webdriver-manager/selenium/selenium-server-standalone.jar',
    host: '127.0.0.1',
    port: 4444,
    cli_args: {
      'webdriver.chrome.driver': '../../node_modules/webdriver-manager/selenium/chromedriver'
    }
  },

  test_settings: {
    default: {
      selenium_port: 4444,
      selenium_host: 'localhost',
      silent: true,
      globals: {
        devServerURL: 'http://localhost:' + (process.env.PORT || 8080),
        CONFIG: spaConstants
      }
    },

    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        javascriptEnabled: true,
        acceptSslCerts: true,
        chromeOptions: {
          args: ['no-sandbox', 'headless']
        }
      }
    },

    firefox: {
      desiredCapabilities: {
        browserName: 'firefox',
        javascriptEnabled: true,
        acceptSslCerts: true
      }
    }
  }
}
