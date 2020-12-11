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
import _Vue from 'vue'
import { AuthSdkError, OktaAuth, AuthState } from '@okta/okta-auth-js'
import applyMixin, { OktaVueMixin } from './mixin'

export type OnAuthRequiredFunction = (oktaAuth: OktaAuth) => Promise<void> | void

export interface OktaVueOptions {
  oktaAuth: OktaAuth
  onAuthRequired: OnAuthRequiredFunction
}

// Declare augmentation for Vue
declare module 'vue/types/vue' {
  interface Vue {
    $auth: OktaAuth
    authState: AuthState
  }
}

// constants are defined in webpack.config.js
declare const PACKAGE: {
  name: string
  version: string
}

function install (Vue: typeof _Vue, {
  oktaAuth,
  onAuthRequired
} = {} as OktaVueOptions) {
  if (!oktaAuth) {
    throw new AuthSdkError('No oktaAuth instance passed to OktaVue.')
  }

  // customize user agent
  oktaAuth.userAgent = `${PACKAGE.name}/${PACKAGE.version} ${oktaAuth.userAgent}`

  applyMixin({ oktaAuth, onAuthRequired })

  // add oktaAuth instance to Vue
  Vue.prototype.$auth = oktaAuth
}

export default { install }

export { OktaVueMixin }

export { default as LoginCallback } from './components/LoginCallback.vue'
