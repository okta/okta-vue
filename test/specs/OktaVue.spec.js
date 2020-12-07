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
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue from '../../src/okta-vue'
import { App, Protected } from '../components'

const pkg = require('../../package.json')

describe('OktaVue', () => {
  let oktaAuth
  let localVue
  let wrapper

  function setupOktaAuth () {
    oktaAuth = new OktaAuth({
      issuer: 'https://foo',
      clientId: 'foo',
      redirectUri: 'https://foo'
    })
  }

  function bootstrap (options = {}) {
    localVue = createLocalVue()
    localVue.use(VueRouter)
    localVue.use(OktaVue, { oktaAuth, ...options })
    const router = new VueRouter({
      routes: [{ path: '/protected', component: Protected, meta: { requiresAuth: true } }]
    })
    wrapper = mount(App, {
      localVue,
      router
    })
  }

  beforeEach(() => {
    setupOktaAuth()
  })

  it('should add custom userAgent to $auth', () => {
    oktaAuth.userAgent = 'foo'
    bootstrap()
    expect(localVue.prototype.$auth.userAgent).toBe(`${pkg.name}/${pkg.version} foo`)
  })

  describe('restoreOriginalUri', () => {
    const mockOriginalUri = 'http://localhost/fakepath'
    it('should call restoreOriginalUri callback if provided when calls restoreOriginalUri', () => {
      oktaAuth.options.restoreOriginalUri = jest.fn()
      bootstrap()
      localVue.prototype.$auth.options.restoreOriginalUri(oktaAuth, mockOriginalUri)
      expect(oktaAuth.options.restoreOriginalUri).toHaveBeenCalledWith(oktaAuth, mockOriginalUri)
    })

    it('should call default implementation when restoreOriginalUri callback is not provided', () => {
      bootstrap()
      jest.spyOn(wrapper.vm.$router, 'replace').mockImplementation()
      localVue.prototype.$auth.options.restoreOriginalUri(oktaAuth, mockOriginalUri)
      expect(wrapper.vm.$router.replace).toHaveBeenCalledWith({ path: '/fakepath' })
    })
  })

  describe('render based on authState', () => {
    it('should render "pending" when initial mount, then render not authenticated after authState update', async () => {
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('pending')
      await waitForExpect(() => {
        expect(wrapper.find('#state').text()).toBe('not authenticated')
      })
    })

    it('should render "authenticated" when authState.isAuthenticated is true', async () => {
      oktaAuth.authStateManager.updateAuthState = jest.fn().mockImplementation(() => {
        oktaAuth.emitter.emit('authStateChange', {
          isPending: false,
          isAuthenticated: true
        })
      })
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('authenticated')
    })

    it('should render "not authenticated" when authState.isAuthenticated is false', async () => {
      oktaAuth.authStateManager.updateAuthState = jest.fn().mockImplementation(() => {
        oktaAuth.emitter.emit('authStateChange', {
          isPending: false,
          isAuthenticated: false
        })
      })
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('not authenticated')
    })

    it('should render based on preset authState from oktaAuth', () => {
      oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
        isPending: false,
        isAuthenticated: false
      })
      oktaAuth.authStateManager.updateAuthState = jest.fn()
      bootstrap()
      expect(wrapper.find('#state').text()).toBe('not authenticated')

      oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
        isPending: false,
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
    wrapper.destroy()
    expect(oktaAuth.authStateManager.unsubscribe).toHaveBeenCalledWith(wrapper.vm.$_oktaVue_handleAuthStateUpdate)
  })

  describe('secure route guard', () => {
    let onAuthRequired
    beforeEach(() => {
      // initial general mocks
      oktaAuth.authStateManager.updateAuthState = jest.fn()
      oktaAuth.setOriginalUri = jest.fn()
      oktaAuth.signInWithRedirect = jest.fn()
      onAuthRequired = jest.fn()
    })

    describe('enter protected route', () => {
      it('should show protected component when authed', async () => {
        oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
          isPending: false,
          isAuthenticated: true
        })
        oktaAuth.isAuthenticated = jest.fn().mockResolvedValue(true)
        bootstrap()
        wrapper.vm.$router.push({ path: '/protected' })
        await waitForExpect(() => {
          expect(wrapper.find('#state').text()).toBe('authenticated')
        })
      })

      it('should call signInWithRedirect when not authed', async () => {
        oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
          isPending: false,
          isAuthenticated: false
        })
        bootstrap()
        wrapper.vm.$router.push({ path: '/protected' })
        await waitForExpect(() => {
          expect(wrapper.find('#state').text()).toBe('not authenticated')
          expect(oktaAuth.setOriginalUri).toHaveBeenCalledWith('/protected')
          expect(oktaAuth.signInWithRedirect).toHaveBeenCalled()
        })
      })

      it('should call onAuthRequired if provided from config when not authed', async () => {
        oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
          isPending: false,
          isAuthenticated: false
        })
        bootstrap({ onAuthRequired })
        wrapper.vm.$router.push({ path: '/protected' })
        await waitForExpect(() => {
          expect(oktaAuth.setOriginalUri).toHaveBeenCalledWith('/protected')
          expect(onAuthRequired).toHaveBeenCalled()
        })
      })
    })

    describe('authState change when already in the protected route', () => {
      it('should call signInWithRedirect', async () => {
        bootstrap()
        // enter /protected
        wrapper.vm.$router.push({ path: '/protected' })
        // change authState
        oktaAuth.emitter.emit('authStateChange', {
          isPending: false,
          isAuthenticated: false
        })
        await waitForExpect(() => {
          expect(wrapper.find('#state').text()).toBe('not authenticated')
          expect(oktaAuth.setOriginalUri).toHaveBeenCalledWith('/protected')
          expect(oktaAuth.signInWithRedirect).toHaveBeenCalled()
        })
      })

      it('should call onAuthRequired if provided', async () => {
        bootstrap({ onAuthRequired })
        // enter /protected
        wrapper.vm.$router.push({ path: '/protected' })
        // change authState
        oktaAuth.emitter.emit('authStateChange', {
          isPending: false,
          isAuthenticated: false
        })
        await waitForExpect(() => {
          expect(wrapper.find('#state').text()).toBe('not authenticated')
          expect(oktaAuth.setOriginalUri).toHaveBeenCalledWith('/protected')
          expect(onAuthRequired).toHaveBeenCalled()
          expect(oktaAuth.signInWithRedirect).not.toHaveBeenCalled()
        })
      })
    })

    it('should unsubscribe guard when leave route', async () => {
      oktaAuth.authStateManager.getAuthState = jest.fn().mockReturnValue({
        isPending: false,
        isAuthenticated: true
      })
      oktaAuth.authStateManager.unsubscribe = jest.fn()
      const next = jest.fn()
      bootstrap()
      const beforeRouteLeave = wrapper.vm.$root.$options.beforeRouteLeave[0]
      beforeRouteLeave.call(wrapper.vm, undefined, undefined, next)
      await wrapper.vm.$nextTick()
      expect(oktaAuth.authStateManager.unsubscribe).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })
})
