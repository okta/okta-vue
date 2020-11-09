/*!
 * Copyright (c) 2017-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

/* global PACKAGE */
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js'

// constants are defined in webpack.config.js
const packageInfo = PACKAGE

export const _handleLogin = async (oktaAuth, originalUri, onAuthRequired) => {
  oktaAuth.setOriginalUri(originalUri)
  if (onAuthRequired) {
    await onAuthRequired()
  } else {
    await oktaAuth.signInWithRedirect()
  }
}

function install (Vue, { onAuthRequired, ...oktaAuthConfig } = {}) {
  const auth = new OktaAuth(oktaAuthConfig)

  // customize user agent
  auth.userAgent = `${packageInfo.name}/${packageInfo.version} ${this.userAgent}`

  const guardSecureRoute = (authState) => {
    if (!authState.isAuthenticated) {
      _handleLogin(auth, originalUriTracker, onAuthRequired)
    }
  }

  let originalUriTracker
  Vue.mixin({
    data () {
      return {
        authState: auth.authStateManager.getAuthState()
      }
    },
    created () {
      // add default restoreOriginalUri callback
      if (!this.$auth.options.restoreOriginalUri && this.$router) {
        auth.options.restoreOriginalUri = (_, originalUri) => {
          this.$router.replace({
            path: toRelativeUrl(originalUri, window.location.origin)
          })
        }
      }

      // subscribe to the latest authState
      auth.authStateManager.subscribe(this.$_oktaVue_handleAuthStateUpdate)
      if (!auth.token.isLoginRedirect()) {
        // trigger an initial change event to make sure authState is latest
        auth.authStateManager.updateAuthState()
      }
    },
    beforeDestroy () {
      auth.authStateManager.unsubscribe(this.$_oktaVue_handleAuthStateUpdate)
    },
    // "beforeRouteEnter" does NOT have access to `this` component instance
    async beforeRouteEnter (to, _, next) {
      const isAuthenticated = await auth.isAuthenticated()
      if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        // subscribe to authState change to protect secure routes after accessing
        auth.authStateManager.subscribe(guardSecureRoute)
        originalUriTracker = to.fullPath
        await _handleLogin(auth, to.fullPath, onAuthRequired)
      } else {
        next()
      }
    },
    beforeRouteLeave (to, from, next) {
      // unsubscribe authState update before leave route
      auth.authStateManager.unsubscribe(guardSecureRoute)
      next()
    },
    // private property naming convention follows
    // https://vuejs.org/v2/style-guide/#Private-property-names-essential
    methods: {
      $_oktaVue_handleAuthStateUpdate: async function (authState) {
        this.authState = Object.assign(this.authState, authState)
      }
    }
  })

  // add oktaAuth instance to Vue
  Vue.prototype.$auth = auth
}

export default { install }
export { default as LoginCallback } from './components/LoginCallback'
