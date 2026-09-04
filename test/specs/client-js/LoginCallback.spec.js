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
import { createRouter, createWebHistory } from 'vue-router'
import { createOktaClient, LoginCallback } from '../../../src/client-js'
import { AppWithRoutes, AppWithRoutesAndSlots, Protected } from '../../components'
import { createOrchestrator } from '../../mocks'

describe('client-js LoginCallback', () => {
  let orchestrator
  let router
  let wrapper

  beforeEach(() => {
    orchestrator = createOrchestrator()
  })

  async function navigateToCallback ({ withCustomErrorSlot = false, path = '/login/callback', ...options } = {}) {
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: 'Home' } },
        { path: '/login/callback', component: LoginCallback },
        { path: '/protected', component: Protected, meta: { requiresAuth: true } }
      ]
    })

    wrapper = mount(withCustomErrorSlot ? AppWithRoutesAndSlots : AppWithRoutes, {
      global: {
        plugins: [router, createOktaClient({ orchestrator, ...options })]
      }
    })

    router.push(path)
    await router.isReady()
  }

  it('resumes the flow with the callback url, including the code and state query params', async () => {
    await navigateToCallback({ path: '/login/callback?code=fake-code&state=fake-state' })
    await waitForExpect(() => {
      expect(orchestrator.resumeFlow)
        .toHaveBeenCalledWith(`${window.location.origin}/login/callback?code=fake-code&state=fake-state`)
    })
  })

  it('replaces the current route with the originalUri recorded when the flow started', async () => {
    await navigateToCallback()
    await waitForExpect(() => {
      expect(router.currentRoute.value.fullPath).toBe('/protected')
    })
  })

  it('preserves query and hash from the originalUri', async () => {
    orchestrator.resumeFlow.mockResolvedValue({ originalUri: '/protected?tab=profile#top' })
    await navigateToCallback()
    await waitForExpect(() => {
      expect(router.currentRoute.value.fullPath).toBe('/protected?tab=profile#top')
    })
  })

  it('reduces an absolute same-origin originalUri to a path the router can navigate', async () => {
    orchestrator.resumeFlow.mockResolvedValue({ originalUri: `${window.location.origin}/protected` })
    await navigateToCallback()
    await waitForExpect(() => {
      expect(router.currentRoute.value.fullPath).toBe('/protected')
    })
  })

  it('falls back to / for an off-origin originalUri', async () => {
    orchestrator.resumeFlow.mockResolvedValue({ originalUri: 'https://evil.example.com/protected' })
    await navigateToCallback()
    await waitForExpect(() => {
      expect(router.currentRoute.value.fullPath).toBe('/')
    })
  })

  it('falls back to / when the flow context carries no originalUri', async () => {
    orchestrator.resumeFlow.mockResolvedValue({})
    await navigateToCallback()
    await waitForExpect(() => {
      expect(router.currentRoute.value.fullPath).toBe('/')
    })
  })

  it('calls restoreOriginalUri instead of the router when provided', async () => {
    const restoreOriginalUri = jest.fn()
    await navigateToCallback({ restoreOriginalUri })
    await waitForExpect(() => {
      expect(restoreOriginalUri).toHaveBeenCalledWith('/protected')
    })
    expect(router.currentRoute.value.fullPath).toBe('/login/callback')
  })

  it('renders nothing while the exchange is in flight and after it succeeds', async () => {
    await navigateToCallback()
    await waitForExpect(() => {
      expect(router.currentRoute.value.fullPath).toBe('/protected')
    })
    expect(wrapper.text()).toBe('protected')
  })

  describe('on failure', () => {
    beforeEach(() => {
      orchestrator.resumeFlow.mockRejectedValue(new Error('state does not match'))
    })

    it('renders the error as text', async () => {
      await navigateToCallback()
      await waitForExpect(() => {
        expect(wrapper.text()).toBe('Error: state does not match')
      })
      expect(router.currentRoute.value.fullPath).toBe('/login/callback')
    })

    it('renders the error slot when one is provided', async () => {
      await navigateToCallback({ withCustomErrorSlot: true })
      await waitForExpect(() => {
        expect(wrapper.text()).toBe('Custom error: Error: state does not match')
      })
    })
  })
})
