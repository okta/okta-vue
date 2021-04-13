import { createApp } from 'vue'
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue from '@okta/okta-vue'
import App from './App.vue'
import router from './router'

declare const CONFIG: {
  ISSUER: string;
  CLIENT_ID: string;
  OKTA_TESTING_DISABLEHTTPSCHECK: string;
}

const redirectUri = window.location.origin + '/login/callback'

const config = {
  issuer: CONFIG.ISSUER,
  redirectUri,
  clientId: CONFIG.CLIENT_ID,
  scopes: ['openid', 'profile', 'email'],
  testing: {
    disableHttpsCheck: false
  }
}

if (CONFIG.OKTA_TESTING_DISABLEHTTPSCHECK) {
  config.testing = {
    disableHttpsCheck: true
  }
}

const oktaAuth = new OktaAuth(config)

const app = createApp(App)
app.use(router)
app.use(OktaVue, { oktaAuth })
app.mount('#app')
