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

import _Vue from 'vue'
import VueRouter from 'vue-router'
import { AuthSdkError, OktaAuth, AuthState, toRelativeUrl } from '@okta/okta-auth-js'
import { OktaVueOptions, OnAuthRequiredFunction } from './types'

// constants are defined in webpack.config.js
declare const PACKAGE: {
  name: string;
  version: string;
}

let _oktaAuth: OktaAuth
let _onAuthRequired: OnAuthRequiredFunction
let _router: VueRouter
let originalUriTracker: string

const guardSecureRoute = async (authState: AuthState) => {
  if (!authState.isAuthenticated) {
    _oktaAuth.setOriginalUri(originalUriTracker)
    if (_onAuthRequired) {
      await _onAuthRequired(_oktaAuth)
    } else {
      await _oktaAuth.signInWithRedirect()
    }
  }
}

const AuthStateMixin = _Vue.extend({
  data () {
    return {
      authState: _oktaAuth.authStateManager.getAuthState()
    }
  },
  created () {
    // subscribe to the latest authState
    _oktaAuth.authStateManager.subscribe(this.$_oktaVue_handleAuthStateUpdate)
    if (!_oktaAuth.token.isLoginRedirect()) {
      // trigger an initial change event to make sure authState is latest
      _oktaAuth.authStateManager.updateAuthState()
    }
  },
  beforeDestroy () {
    _oktaAuth.authStateManager.unsubscribe(this.$_oktaVue_handleAuthStateUpdate)
  },
  // private property naming convention follows
  // https://vuejs.org/v2/style-guide/#Private-property-names-essential
  methods: {
    // eslint-disable-next-line @typescript-eslint/camelcase
    async $_oktaVue_handleAuthStateUpdate (authState: AuthState) {
      this.authState = Object.assign(this.authState, authState)
    }
  }
})

export const NavigationGuardMixin = _Vue.extend({
  beforeCreate () {
    // assign router for the default restoreOriginalUri callback
    _router = this.$router
  },
  // "beforeRouteEnter" does NOT have access to `this` component instance
  async beforeRouteEnter (to, from, next) {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      // track the originalUri for guardSecureRoute
      originalUriTracker = to.fullPath

      // subscribe to authState change to protect secure routes when authState change
      // all secure routes should subscribe before enter the route
      _oktaAuth.authStateManager.subscribe(guardSecureRoute)

      // guard the secure route based on the authState when enter
      const isAuthenticated = await _oktaAuth.isAuthenticated()
      if (!isAuthenticated) {
        const authState = _oktaAuth.authStateManager.getAuthState()
        await guardSecureRoute(authState)
      } else {
        next()
      }
    } else {
      next()
    }
  },
  beforeRouteLeave (to, from, next) {
    _oktaAuth.authStateManager.unsubscribe(guardSecureRoute)
    next()
  }
})

function install (Vue: typeof _Vue, {
  oktaAuth,
  onAuthRequired
} = {} as OktaVueOptions) {
  if (!oktaAuth) {
    throw new AuthSdkError('No oktaAuth instance passed to OktaVue.')
  }

  // customize user agent
  oktaAuth.userAgent = `${PACKAGE.name}/${PACKAGE.version} ${oktaAuth.userAgent}`

  // add default restoreOriginalUri callback
  if (!oktaAuth.options.restoreOriginalUri) {
    oktaAuth.options.restoreOriginalUri = async (oktaAuth: OktaAuth, originalUri: string) => {
      // If a router is available, provide a default implementation
      if (_router) {
        const path = toRelativeUrl(originalUri, window.location.origin)
        _router.replace({ path })
        return
      }
    }
  }

  _oktaAuth = oktaAuth
  _onAuthRequired = onAuthRequired

  Vue.mixin(AuthStateMixin)
  Vue.mixin(NavigationGuardMixin)

  // add oktaAuth instance to Vue
  Vue.prototype.$auth = oktaAuth
}

export default { install }

export { default as LoginCallback } from './components/LoginCallback.vue'
