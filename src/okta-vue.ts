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

import { App } from 'vue'
import { Router, RouteLocationNormalized } from 'vue-router'
import { AuthSdkError, OktaAuth, AuthState, toRelativeUrl } from '@okta/okta-auth-js'
import { compare } from 'compare-versions';
import { OktaVueOptions, OnAuthRequiredFunction } from './types'

// constants are defined in webpack.config.js
declare const PACKAGE: {
  name: string;
  version: string;
}

declare const AUTH_JS: {
  minSupportedVersion: string;
}

let _oktaAuth: OktaAuth
let _onAuthRequired: OnAuthRequiredFunction
let _router: Router
let originalUriTracker: string

const guardSecureRoute = async (authState: AuthState | null) => {
  if (authState && !authState.isAuthenticated) {
    _oktaAuth.setOriginalUri(originalUriTracker)
    if (_onAuthRequired) {
      await _onAuthRequired(_oktaAuth)
    } else {
      await _oktaAuth.signInWithRedirect()
    }
  }
}

export const navigationGuard = async (to: RouteLocationNormalized) => {
  // clear any subscribed guardSecureRoute
  _oktaAuth.authStateManager.unsubscribe(guardSecureRoute)

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
      return false
    }

    return true
  }
    
  return true
}


function install (app: App, {
  oktaAuth,
  onAuthRequired,
  onAuthResume
} = {} as OktaVueOptions) {
  if (!oktaAuth) {
    throw new AuthSdkError('No oktaAuth instance passed to OktaVue.')
  }

  _oktaAuth = oktaAuth
  _onAuthRequired = onAuthRequired

  if (oktaAuth._oktaUserAgent) {
    const isAuthJsSupported = compare(oktaAuth._oktaUserAgent.getVersion(), AUTH_JS.minSupportedVersion, '>=');
    if (!isAuthJsSupported) {
      throw new AuthSdkError(`
      Passed in oktaAuth is not compatible with the SDK,
      minimum supported okta-auth-js version is ${AUTH_JS.minSupportedVersion}.
    `);
    }

    // customize user agent
    oktaAuth._oktaUserAgent.addEnvironment(`${PACKAGE.name}/${PACKAGE.version}`);
  } else {
    // TODO: just throw based on the minimum supported auth-js version in the next major version
    console.warn('_oktaUserAgent is not available on auth SDK instance. Please use okta-auth-js@^5.3.1 .');
  }

  // add default restoreOriginalUri callback
  if (!oktaAuth.options.restoreOriginalUri) {
    oktaAuth.options.restoreOriginalUri = async (oktaAuth: OktaAuth, originalUri: string) => {
      // If a router is available, provide a default implementation
      if (_router) {
        const path = toRelativeUrl(originalUri || '/', window.location.origin);
        _router.replace({ path })
      }
    }
  }

  // Calculates initial auth state and fires change event for listeners
  // Also starts services
  oktaAuth.start();

  app.mixin({
    data () {
      return {
        authState: oktaAuth.authStateManager.getAuthState()
      }
    },
    beforeCreate () {
      // assign router for the default restoreOriginalUri callback
      _router = this.$router
    },
    created () {
      // subscribe to the latest authState
      this.authState = oktaAuth.authStateManager.getAuthState()
      oktaAuth.authStateManager.subscribe(this.$_oktaVue_handleAuthStateUpdate)
    },
    beforeUnmount () {
      oktaAuth.authStateManager.unsubscribe(this.$_oktaVue_handleAuthStateUpdate)
    },
    // private property naming convention follows
    // https://vuejs.org/v2/style-guide/#Private-property-names-essential
    methods: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      async $_oktaVue_handleAuthStateUpdate (authState: AuthState) {
        this.authState = Object.assign(this.authState || {}, authState)
      }
    }
  })

  // add additional options to oktaAuth options
  Object.assign(oktaAuth.options, {
    onAuthRequired,
    onAuthResume
  })

  // add oktaAuth instance to Vue
  app.config.globalProperties.$auth = oktaAuth
}

export default { install }
