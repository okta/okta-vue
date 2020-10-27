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
import { toRelativeUrl, AuthSdkError } from '@okta/okta-auth-js'

// constants are defined in webpack.config.js
const packageInfo = PACKAGE

function install (Vue, {
  oktaAuth,
  onAuthRequired
} = {}) {
  if (!oktaAuth) {
    throw AuthSdkError('No oktaAuth instance passed to OktaVue.')
  }

  // customize user agent
  oktaAuth.userAgent = `${packageInfo.name}/${packageInfo.version} ${oktaAuth.userAgent}`

  // add default restoreOriginalUri callback
  let router
  if (!oktaAuth.options.restoreOriginalUri) {
    oktaAuth.options.restoreOriginalUri = async (_, originalUri) => {
      // If a router is available, provide a default implementation
      if (router) {
        const path = toRelativeUrl(originalUri, window.location.origin)
        return router.replace({ path })
      }
    }
  }

  let originalUriTracker
  const guardSecureRoute = async (authState) => {
    if (!authState.isAuthenticated) {
      oktaAuth.setOriginalUri(originalUriTracker)
      if (onAuthRequired) {
        await onAuthRequired(oktaAuth)
      } else {
        await oktaAuth.signInWithRedirect()
      }
    }
  }

  Vue.mixin({
    data () {
      return {
        authState: oktaAuth.authStateManager.getAuthState()
      }
    },
    created () {
      // assign router for the default restoreOriginalUri callback
      router = this.$router

      // subscribe to the latest authState
      oktaAuth.authStateManager.subscribe(this.$_oktaVue_handleAuthStateUpdate)
      if (!oktaAuth.token.isLoginRedirect()) {
        // trigger an initial change event to make sure authState is latest
        oktaAuth.authStateManager.updateAuthState()
      }
    },
    beforeDestroy () {
      oktaAuth.authStateManager.unsubscribe(this.$_oktaVue_handleAuthStateUpdate)
    },
    // "beforeRouteEnter" does NOT have access to `this` component instance
    async beforeRouteEnter (to, _, next) {
      if (to.matched.some(record => record.meta.requiresAuth)) {
        // track the originalUri for guardSecureRoute
        originalUriTracker = to.fullPath

        // subscribe to authState change to protect secure routes when authState change
        // all secure routes should subscribe before enter the route
        oktaAuth.authStateManager.subscribe(guardSecureRoute)

        // guard the secure route based on the authState when enter
        const isAuthenticated = await oktaAuth.isAuthenticated()
        if (!isAuthenticated) {
          const authState = oktaAuth.authStateManager.getAuthState()
          await guardSecureRoute(authState)
        } else {
          next()
        }
      } else {
        next()
      }
    },
    beforeRouteLeave (to, from, next) {
      oktaAuth.authStateManager.unsubscribe(guardSecureRoute)
      next()
    },
    // private property naming convention follows
    // https://vuejs.org/v2/style-guide/#Private-property-names-essential
    methods: {
      async $_oktaVue_handleAuthStateUpdate (authState) {
        this.authState = Object.assign(this.authState, authState)
      }
    }
  })

  // add oktaAuth instance to Vue
  Vue.prototype.$auth = oktaAuth
}

export default { install }

export { default as LoginCallback } from './components/LoginCallback'
