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

import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue, { LoginCallback } from '../../src'

const oktaAuth = new OktaAuth({
  issuer: 'https://foo',
  clientId: 'foo',
  redirectUri: 'https://foo'
})

describe('LoginCallback', () => {
  let localVue
  function bootstrap (options = {}) {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(OktaVue, { oktaAuth })

    jest.spyOn(localVue.prototype.$auth, 'handleLoginRedirect')
    jest.spyOn(localVue.prototype.$auth, 'isLoginRedirect').mockReturnValue(options.isLoginRedirect)
    jest.spyOn(localVue.prototype.$auth, 'storeTokensFromRedirect').mockImplementation(() => {
      return new Promise(resolve => {
        if (localVue.prototype.$auth.isLoginRedirect()) {
          localVue.prototype.$auth.emitter.emit('authStateChange', { isPending: false })
        }
        resolve()
      })
    })
    jest.spyOn(localVue.prototype.$auth.options, 'restoreOriginalUri')

    const router = new VueRouter({
      routes: [{ path: '/foo', component: LoginCallback }]
    })
    mount(LoginCallback, {
      localVue,
      router
    })
  }

  it('renders the component', () => {
    bootstrap()
  })

  it('calls handleLoginRedirect', () => {
    bootstrap()
    expect(localVue.prototype.$auth.handleLoginRedirect).toHaveBeenCalled()
  })

  it('calls the default "restoreOriginalUri" options when in login redirect uri', () => {
    bootstrap({ isLoginRedirect: true })
    expect(localVue.prototype.$auth.options.restoreOriginalUri).toHaveBeenCalled()
  })

  it('should not call the default "restoreOriginalUri" options when not in login redirect uri', () => {
    bootstrap({ isLoginRedirect: false })
    expect(localVue.prototype.$auth.options.restoreOriginalUri).not.toHaveBeenCalled()
  })
})
