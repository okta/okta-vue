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

import { createLocalVue } from '@vue/test-utils'
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue, { LoginCallback } from '../../src'
import InternalLoginCallback from '../../src/components/LoginCallback'

const baseConfig = {
  issuer: 'https://foo',
  clientId: 'foo',
  redirectUri: 'foo'
}

describe('OktaVue module', () => {
  test('is a Vue plugin', () => {
    expect(OktaVue.install).toBeTruthy()
  })
  test('Sets an instance of Auth on Vue prototype', () => {
    const oktaAuth = new OktaAuth(baseConfig)
    const localVue = createLocalVue()
    localVue.use(OktaVue, { oktaAuth })
    expect(localVue.prototype.$auth instanceof OktaAuth).toBeTruthy()
  })
  test('Exports "LoginCallback" component', () => {
    expect(LoginCallback).toBe(InternalLoginCallback)
  })
})
