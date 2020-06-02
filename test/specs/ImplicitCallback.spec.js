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
import waitForExpect from 'wait-for-expect'
import VueRouter from 'vue-router'
import { default as OktaVue } from '../../src/okta-vue'
import AuthJS from '@okta/okta-auth-js'

jest.mock('@okta/okta-auth-js')

describe('ImplicitCallback', () => {
  const baseConfig = {
    issuer: 'https://foo',
    clientId: 'foo',
    redirectUri: 'https://foo'
  }

  let localVue
  let wrapper
  function bootstrap (options = {}) {
    AuthJS.mockImplementation(() => {
      return {
        tokenManager: {
          on: jest.fn()
        }
      }
    })

    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(OktaVue, baseConfig)
    jest.spyOn(localVue.prototype.$auth, 'handleAuthentication').mockImplementation(async () => {
      return Promise.resolve(options.result)
    })
    jest.spyOn(localVue.prototype.$auth, 'getFromUri').mockImplementation(() => {
      return options.fromUri
    })

    const routes = [{ path: '/foo', component: OktaVue.handleCallback() }]
    const router = new VueRouter({
      routes
    })
    wrapper = mount(OktaVue.handleCallback(), {
      localVue,
      router
    })
    expect(wrapper.vm.$route).toBeInstanceOf(Object)
    jest.spyOn(wrapper.vm.$router, 'replace').mockImplementation()
  }

  it('renders the component', () => {
    bootstrap()
  })

  it('calls handleAuthentication', async () => {
    bootstrap()
    expect(localVue.prototype.$auth.handleAuthentication).toHaveBeenCalled()
    await waitForExpect(() => {
      expect(wrapper.vm.$router.replace).toHaveBeenCalled()
    })
  })

  it('calls router replace with the fromUri', async () => {
    const fromUri = 'https://fake'
    bootstrap({
      fromUri
    })
    await waitForExpect(() => {
      expect(wrapper.vm.$router.replace).toHaveBeenCalled()
    })
    expect(localVue.prototype.$auth.getFromUri).toHaveBeenCalled()
    expect(wrapper.vm.$router.replace).toHaveBeenCalledWith({ path: fromUri })
  })

  // TODO: handle errors on callback?
  xit('handles promise rejection', () => {
    bootstrap({
      result: Promise.reject(new Error('test'))
    })
  })
})
