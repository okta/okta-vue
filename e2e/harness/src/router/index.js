/* global CONFIG */
import Vue from 'vue'
import Router from 'vue-router'
import Protected from '@/components/Protected'
import SessionTokenLogin from '@/components/SessionTokenLogin'

import Auth, { LoginCallback } from '@okta/okta-vue'

// To perform end-to-end PKCE flow we must be configured on both ends: when the login is initiated, and on the callback
// The login page is loaded with a query param. This will select a unique callback url
// On the callback load we detect PKCE by inspecting the pathname
const url = new URL(window.location.href)
const pkce = !!url.searchParams.get('pkce') || url.pathname.indexOf('pkce/callback') >= 0
const redirectUri = window.location.origin + (pkce ? '/pkce/callback' : '/implicit/callback')

let config = {
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

Vue.use(Router)
Vue.use(Auth, config)

const router = new Router({
  mode: 'history',
  base: '/',
  routes: [
    { path: '/implicit/callback', component: LoginCallback },
    { path: '/pkce/callback', component: LoginCallback },
    { path: '/protected', component: Protected, meta: { requiresAuth: true } },
    { path: '/sessionToken', component: SessionTokenLogin }
  ]
})

export default router
