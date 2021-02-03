import Vue from 'vue'
import { OktaAuth } from '@okta/okta-auth-js';
import OktaVue from '@okta/okta-vue';
import App from './App.vue';
import router from './router';

Vue.config.productionTip = false;

declare const CONFIG: {
  ISSUER: string;
  CLIENT_ID: string;
  OKTA_TESTING_DISABLEHTTPSCHECK: string;
}

// To perform end-to-end PKCE flow we must be configured on both ends: when the login is initiated, and on the callback
// The login page is loaded with a query param. This will select a unique callback url
// On the callback load we detect PKCE by inspecting the pathname
const url = new URL(window.location.href)
const pkce = !!url.searchParams.get('pkce') || url.pathname.indexOf('pkce/callback') >= 0
const redirectUri = window.location.origin + (pkce ? '/pkce/callback' : '/login/callback')

const config = {
  issuer: CONFIG.ISSUER,
  redirectUri,
  pkce,
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
Vue.use(OktaVue, { oktaAuth })

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app');
