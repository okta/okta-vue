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

import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue, { LoginCallback } from '../../src'
import { AppWithRoutes } from '../components'

describe('LoginCallback', () => {
  let oktaAuth
  async function bootstrap (options = {}) {
    oktaAuth = new OktaAuth({
      issuer: 'https://foo',
      clientId: 'foo',
      redirectUri: 'https://foo'
    })
    jest.spyOn(oktaAuth, 'handleLoginRedirect')
    jest.spyOn(oktaAuth, 'isLoginRedirect').mockReturnValue(options.isLoginRedirect)
    jest.spyOn(oktaAuth, 'storeTokensFromRedirect').mockImplementation(() => {
      return new Promise(resolve => {
        if (oktaAuth.isLoginRedirect()) {
          oktaAuth.emitter.emit('authStateChange', { isPending: false })
        }
        resolve()
      })
    })
    oktaAuth.options.restoreOriginalUri = jest.fn()

    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: LoginCallback }
      ]
    })
    mount(AppWithRoutes, {
      global: {
        plugins: [
          router, 
          [OktaVue, { oktaAuth }]
        ]
      }
    })

    router.push('/')
    await router.isReady()
  }

  it('renders the component', async () => {
    await bootstrap()
  })

  it('calls handleLoginRedirect', async () => {
    await bootstrap()
    expect(oktaAuth.handleLoginRedirect).toHaveBeenCalled()
  })

  it('calls the default "restoreOriginalUri" options when in login redirect uri', async () => {
    await bootstrap({ isLoginRedirect: true })
    expect(oktaAuth.options.restoreOriginalUri).toHaveBeenCalled()
  })

  it('should not call the default "restoreOriginalUri" options when not in login redirect uri', async () => {
    await bootstrap({ isLoginRedirect: false })
    expect(oktaAuth.options.restoreOriginalUri).not.toHaveBeenCalled()
  })
})
