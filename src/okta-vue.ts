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

import { App, shallowRef, triggerRef, version } from 'vue'
import { Router, RouteLocationNormalized } from 'vue-router'
import { AuthSdkError, OktaAuth, AuthState, toRelativeUrl } from '@okta/okta-auth-js'
import { compare } from 'compare-versions';
import { OktaVueOptions, OnAuthRequiredFunction, OktaAuthVue } from './types'

// constants are defined in webpack.config.js
declare const PACKAGE: {
  name: string;
  version: string;
}

declare const AUTH_JS: {
  minSupportedVersion: string;
}

let _oktaAuth: OktaAuthVue
let _onAuthRequired: OnAuthRequiredFunction | undefined
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
      const $router: Router = app.config.globalProperties.$router;
      if ($router) {
        const path = toRelativeUrl(originalUri || '/', window.location.origin);
        $router.replace({ path })
      }
    }
  }

  // Calculates initial auth state and fires change event for listeners
  // Also starts services
  oktaAuth.start();

  // Subscribe to the latest authState
  const authStateRef = shallowRef(oktaAuth.authStateManager.getAuthState())
  const handleAuthStateUpdate = async function(authState: AuthState) {
    authStateRef.value = authState
    triggerRef(authStateRef)
  }
  oktaAuth.authStateManager.subscribe(handleAuthStateUpdate)

  // Use mixin to support Options API
  if (__VUE_OPTIONS_API__ !== false) {
    app.mixin({
      computed: {
        authState() {
          return authStateRef.value
        }
      }
    })
  }
  // Provide ref to authState to support Composition API
  if (compare(version, '3.3', '<')) {
    // Should be unwrapped in all 3.x versions
    app.config.unwrapInjectedRef = true
  }
  app.provide('okta.authState', authStateRef)

  // add additional options to oktaAuth options
  Object.assign(oktaAuth.options, {
    onAuthRequired,
    onAuthResume
  })

  // add oktaAuth instance to Vue
  app.config.globalProperties.$auth = oktaAuth
}

export function useAuth() {
  if (!_oktaAuth) {
    throw new AuthSdkError('No oktaAuth instance has instantiated.')
  }

  return _oktaAuth
}

export default { install }
