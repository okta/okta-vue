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
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue, { LoginCallback, navigationGuard } from '../../src'
import InternalLoginCallback from '../../src/components/LoginCallback'
import { navigationGuard as internalNavigationGuard } from '../../src/okta-vue'

const baseConfig = {
  issuer: 'https://foo',
  clientId: 'foo',
  redirectUri: 'foo'
}

describe('OktaVue module', () => {
  test('is a Vue plugin', () => {
    expect(OktaVue.install).toBeTruthy()
  })
  test('sets an instance of Auth on Vue prototype', () => {
    const App = {
      template: '<div></div>'
    }
    const oktaAuth = new OktaAuth(baseConfig)
    const wrapper = mount(App, {
      global: {
        plugins: [
          [OktaVue, { oktaAuth }]
        ]
      }
    })
    expect(wrapper.vm.$auth instanceof OktaAuth).toBeTruthy()
    oktaAuth.stop()
  })
  test('exports "LoginCallback" component', () => {
    expect(LoginCallback).toBe(InternalLoginCallback)
  })
  test('exports "navigationGuard"', () => {
    expect(navigationGuard).toBe(internalNavigationGuard)
  })
})
