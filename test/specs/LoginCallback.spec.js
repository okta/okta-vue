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

import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { OktaAuth } from '@okta/okta-auth-js'
import OktaVue, { LoginCallback } from '../../src'
import { AppWithRoutes, AppWithRoutesAndSlots } from '../components'

describe('LoginCallback', () => {
  let oktaAuth
  let wrapper

  function createOktaAuth(options = {}) {
    oktaAuth = new OktaAuth(Object.assign({
      issuer: 'https://foo',
      clientId: 'foo',
      redirectUri: 'https://foo'
    }, options));
  }

  afterEach(() => {
    oktaAuth?.stop()
    oktaAuth = null
    wrapper = null
  })

  async function navigateToCallback (options = {}) {
    jest.spyOn(oktaAuth, 'isLoginRedirect').mockReturnValue(options.isLoginRedirect)
    jest.spyOn(oktaAuth, 'storeTokensFromRedirect').mockResolvedValue(undefined)
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: LoginCallback }
      ]
    })
    const { onAuthRequired, onAuthResume } = options;
    const Comp = options.withCustomErrorSlot ? AppWithRoutesAndSlots : AppWithRoutes;
    wrapper = mount(Comp, {
      global: {
        plugins: [
          router, 
          [OktaVue, { oktaAuth, onAuthRequired, onAuthResume }]
        ]
      }
    })
    
    router.push('/')
    await router.isReady()
  }

  it('renders the component', async () => {
    createOktaAuth()
    jest.spyOn(LoginCallback, 'render')
    await navigateToCallback()
    expect(LoginCallback.render).toHaveBeenCalled()
    expect(wrapper.text()).toBe('')
  })

  it('calls handleLoginRedirect', async () => {
    createOktaAuth()
    jest.spyOn(oktaAuth, 'handleLoginRedirect');
    await navigateToCallback()
    expect(oktaAuth.handleLoginRedirect).toHaveBeenCalled()
  })

  it('does not start oktaAuth service on login redirect', async () => {
    createOktaAuth()
    jest.spyOn(oktaAuth, 'handleLoginRedirect');
    jest.spyOn(oktaAuth, 'start');
    await navigateToCallback()
    expect(oktaAuth.handleLoginRedirect).toHaveBeenCalled()
    expect(oktaAuth.start).not.toHaveBeenCalled()
  })

  it('calls the default "restoreOriginalUri" options when in login redirect uri', async () => {
    createOktaAuth()

    const parseFromUrl = oktaAuth.token.parseFromUrl = jest.fn();
    parseFromUrl._getLocation = jest.fn().mockReturnValue({
      hash: '#mock-hash',
      search: '?mock-search'
    });
    
    await navigateToCallback({ isLoginRedirect: true })
    jest.spyOn(oktaAuth.options, 'restoreOriginalUri')
    // nextTick only wait on dom updates, explicitly wait for the next event loop happen as no dom update here
    await new Promise(resolve => setTimeout(resolve))
    expect(oktaAuth.options.restoreOriginalUri).toHaveBeenCalled()
  })

  it('should not call the default "restoreOriginalUri" options when not in login redirect uri', async () => {
    createOktaAuth()
    await navigateToCallback({ isLoginRedirect: false })
    jest.spyOn(oktaAuth.options, 'restoreOriginalUri');
    // nextTick only wait on dom updates, explicitly wait for the next event loop happen as no dom update here
    await new Promise(resolve => setTimeout(resolve))
    expect(oktaAuth.options.restoreOriginalUri).not.toHaveBeenCalled()
  })

  it('shows errors', async () => {
    createOktaAuth()
    const error = new Error('my fake error')
    jest.spyOn(oktaAuth, 'handleLoginRedirect').mockReturnValue(Promise.reject(error))
    await navigateToCallback({ isLoginRedirect: true })
    await nextTick();
    expect(wrapper.text()).toBe('Error: my fake error')
  })

  it('shows errors with custom error slot', async () => {
    createOktaAuth()
    const error = new Error('my fake error')
    jest.spyOn(oktaAuth, 'handleLoginRedirect').mockReturnValue(Promise.reject(error))
    await navigateToCallback({ isLoginRedirect: true, withCustomErrorSlot: true })
    await nextTick();
    expect(wrapper.text()).toBe('Custom error: Error: my fake error')
  })

  describe('interaction code flow', () => {
    beforeEach(() => {
      createOktaAuth()
      const error = new Error('interaction_required')
      jest.spyOn(oktaAuth, 'handleLoginRedirect').mockReturnValue(Promise.reject(error))
      jest.spyOn(oktaAuth.idx, 'isInteractionRequiredError').mockReturnValue(true);
    })

    it('calls onAuthResume', async () => {
      const onAuthResume = jest.fn();
      await navigateToCallback({ isLoginRedirect: true, onAuthResume })
      await nextTick();
      expect(onAuthResume).toHaveBeenCalledWith(oktaAuth);
      expect(wrapper.text()).toBe('')
    })

    it('calls onAuthRequired if onAuthResume is not defined', async () => {
      const onAuthRequired = jest.fn();
      await navigateToCallback({ isLoginRedirect: true, onAuthRequired })
      await nextTick();
      expect(onAuthRequired).toHaveBeenCalledWith(oktaAuth);
      expect(wrapper.text()).toBe('')
    })

    it('shows error if neither onAuthResume nor onAuthRequired are defined', async () => {
      await navigateToCallback({ isLoginRedirect: true })
      await nextTick();
      expect(wrapper.text()).toBe('Error: interaction_required')
    })
  })
})
