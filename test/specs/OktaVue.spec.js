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
import waitForExpect from 'wait-for-expect'
import { AuthSdkError, OktaAuth } from '@okta/okta-auth-js'
import OktaVue from '../../src/okta-vue'
import { App } from '../components'

const pkg = require('../../package.json')

describe('OktaVue', () => {
  let oktaAuth
  let wrapper
  let mockRouter

  function setupOktaAuth () {
    oktaAuth = new OktaAuth({
      issuer: 'https://foo',
      clientId: 'foo',
      redirectUri: 'https://foo'
    })
  }

  function bootstrap (options = {}) {
    mockRouter = {
      replace: jest.fn()
    }
    wrapper = mount(App, {
      global: {
        plugins: [
          [OktaVue, { oktaAuth, ...options }]
        ],
        mocks: {
          $router: mockRouter
        }
      }
    })
  }

  beforeEach(() => {
    setupOktaAuth()
  })

  it('should add environment to oktaAuth\'s _oktaUserAgent', () => {
    bootstrap()
    const userAgent = wrapper.vm.$auth._oktaUserAgent.getHttpHeader()['X-Okta-User-Agent-Extended'];
    expect(
      userAgent.indexOf(`${pkg.name}/${pkg.version}`)
    ).toBeGreaterThan(-1);
  })

  it('throws when provided OktaAuth instance of unsupported version', () => {
    oktaAuth._oktaUserAgent.getVersion = jest.fn().mockReturnValue('okta-auth-js/99.0.42');
    expect(() => bootstrap()).toThrow(AuthSdkError);
  })

  describe('restoreOriginalUri', () => {
    const mockOriginalUri = 'http://localhost/fakepath'
    it('should call restoreOriginalUri callback if provided when calls restoreOriginalUri', () => {
      oktaAuth.options.restoreOriginalUri = jest.fn()
      bootstrap()
      wrapper.vm.$auth.options.restoreOriginalUri(oktaAuth, mockOriginalUri)
      expect(oktaAuth.options.restoreOriginalUri).toHaveBeenCalledWith(oktaAuth, mockOriginalUri)
    })

    it('should call default implementation when restoreOriginalUri callback is not provided', () => {
      bootstrap()
      wrapper.vm.$auth.options.restoreOriginalUri(oktaAuth, mockOriginalUri)
      expect(mockRouter.replace).toHaveBeenCalledWith({ path: '/fakepath' })
    })
  })

  it('should has authState property in app instance', () => {
    bootstrap()
    expect(wrapper.vm.authState).toBeDefined()
  })

  describe('render based on authState', () => {
    it('should render "pending" when initial mount, then render not authenticated after authState update', async () => {
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('pending')
      await waitForExpect(() => {
        expect(wrapper.find('#state').text()).toBe('not authenticated')
      })
    })

    it('should render "authenticated" when authState.isAuthenticated is true', () => {
      oktaAuth.authStateManager.updateAuthState = jest.fn().mockImplementation(() => {
        oktaAuth.emitter.emit('authStateChange', {
          isAuthenticated: true
        })
      })
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('authenticated')
    })

    it('should render "not authenticated" when authState.isAuthenticated is false', () => {
      oktaAuth.authStateManager.updateAuthState = jest.fn().mockImplementation(() => {
        oktaAuth.emitter.emit('authStateChange', {
          isAuthenticated: false
        })
      })
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('not authenticated')
    })

    it('should render based on preset authState from oktaAuth', () => {
      oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
        isAuthenticated: false
      })
      oktaAuth.authStateManager.updateAuthState = jest.fn()
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('not authenticated')

      // reset modified auth-js' userAgent
      setupOktaAuth()
      oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
        isAuthenticated: true
      })
      oktaAuth.authStateManager.updateAuthState = jest.fn()
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('authenticated')
    })
  })

  it('should unsubscribe authState change when before component destroy', () => {
    oktaAuth.authStateManager.unsubscribe = jest.fn()
    bootstrap()
    wrapper.unmount()
    expect(oktaAuth.authStateManager.unsubscribe).toHaveBeenCalledWith(wrapper.vm.$_oktaVue_handleAuthStateUpdate)
  })

})
