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
import { createAuthGuard, createOktaClient } from '../../../src/client-js'
import { AppWithRoutes, Protected } from '../../components'
import { createOrchestrator } from '../../mocks'

describe('createAuthGuard', () => {
  let orchestrator

  beforeEach(() => {
    orchestrator = createOrchestrator()
  })

  it('throws without an orchestrator', () => {
    expect(() => createAuthGuard()).toThrow('No orchestrator passed to createAuthGuard.')
  })

  describe('called directly', () => {
    const route = (meta, fullPath = '/protected') => ({ matched: [{ meta }], fullPath })

    it('lets unguarded routes through without resolving a token', async () => {
      await expect(createAuthGuard(orchestrator)(route({}, '/'))).resolves.toBe(true)
      expect(orchestrator.getToken).not.toHaveBeenCalled()
    })

    it('allows the navigation when a token resolves', async () => {
      await expect(createAuthGuard(orchestrator)(route({ requiresAuth: true }))).resolves.toBe(true)
      expect(orchestrator.getToken).toHaveBeenCalled()
    })

    it('guards a route whose ancestor carries the meta flag', async () => {
      const to = { matched: [{ meta: { requiresAuth: true } }, { meta: {} }], fullPath: '/protected/child' }
      await expect(createAuthGuard(orchestrator)(to)).resolves.toBe(true)
      expect(orchestrator.getToken).toHaveBeenCalled()
    })

    // `getToken()` returns `null` only when the orchestrator was built with `avoidPrompting: true`
    // and so declined to redirect. Otherwise it redirects and never settles, which aborts the
    // navigation the same way the okta-auth-js `navigationGuard`'s `return false` does.
    it('aborts the navigation when the orchestrator declines to prompt', async () => {
      orchestrator.getToken.mockResolvedValue(null)
      await expect(createAuthGuard(orchestrator)(route({ requiresAuth: true }))).resolves.toBe(false)
    })

    it('lets unexpected failures propagate', async () => {
      orchestrator.getToken.mockRejectedValue(new Error('token endpoint exploded'))
      await expect(createAuthGuard(orchestrator)(route({ requiresAuth: true })))
        .rejects.toThrow('token endpoint exploded')
    })

    describe('originalUri', () => {
      it('records the target route, matching setOriginalUri(to.fullPath) on the auth-js path', async () => {
        await createAuthGuard(orchestrator)(route({ requiresAuth: true }, '/protected?foo=bar'))
        expect(orchestrator.options.getOriginalUri()).toBe('/protected?foo=bar')
      })

      it('is not recorded for unguarded routes', async () => {
        await createAuthGuard(orchestrator)(route({}, '/'))
        expect(orchestrator.options.getOriginalUri).toBeUndefined()
      })

      it('can be derived from the route', async () => {
        const guard = createAuthGuard(orchestrator, { originalUri: to => `${to.fullPath}#deep` })
        await guard(route({ requiresAuth: true }))
        expect(orchestrator.options.getOriginalUri()).toBe('/protected#deep')
      })
    })

    describe('params', () => {
      it('passes nothing through by default', async () => {
        await createAuthGuard(orchestrator)(route({ requiresAuth: true }))
        expect(orchestrator.getToken).toHaveBeenCalledWith(undefined)
      })

      it('forwards a static params object', async () => {
        const params = { scopes: ['openid', 'admin'] }
        await createAuthGuard(orchestrator, { params })(route({ requiresAuth: true }))
        expect(orchestrator.getToken).toHaveBeenCalledWith(params)
      })

      it('forwards params derived from the route', async () => {
        const to = { matched: [{ meta: { requiresAuth: true, scopes: ['admin'] } }], fullPath: '/protected' }
        const guard = createAuthGuard(orchestrator, { params: t => ({ scopes: t.matched[0].meta.scopes }) })
        await guard(to)
        expect(orchestrator.getToken).toHaveBeenCalledWith({ scopes: ['admin'] })
      })
    })
  })

  describe('registered on a router', () => {
    let router
    let wrapper

    function bootstrap ({ guard } = {}) {
      const okta = createOktaClient({ orchestrator })
      router = createRouter({
        history: createWebHistory(),
        routes: [
          { path: '/', component: { template: 'Home' } },
          { path: '/protected', component: Protected, meta: { requiresAuth: true } }
        ]
      })
      router.beforeEach(guard ?? okta.authGuard)

      wrapper = mount(AppWithRoutes, {
        global: { plugins: [router, okta] }
      })
    }

    it('renders the protected component when a token resolves', async () => {
      bootstrap()
      router.push({ path: '/protected' })
      await router.isReady()
      expect(wrapper.get('[data-test="protected"]').text()).toBe('protected')
    })

    it('does not render the protected component when the navigation is aborted', async () => {
      orchestrator.getToken.mockResolvedValue(null)
      bootstrap()
      router.push({ path: '/protected' })
      await waitForExpect(() => {
        expect(orchestrator.getToken).toHaveBeenCalled()
        expect(wrapper.findAll('[data-test="protected"]')).toHaveLength(0)
      })
    })

    it('records the full path of the route being entered, not the one being left', async () => {
      bootstrap()
      router.push({ path: '/' })
      await router.isReady()
      router.push({ path: '/protected', query: { tab: 'profile' } })
      await waitForExpect(() => {
        expect(orchestrator.options.getOriginalUri()).toBe('/protected?tab=profile')
      })
    })

    it('surfaces unexpected failures through router.onError', async () => {
      orchestrator.getToken.mockRejectedValue(new Error('token endpoint exploded'))
      bootstrap()
      const onError = jest.fn()
      router.onError(onError)
      router.push({ path: '/protected' }).catch(() => {})
      // `router.onError` handlers are called with (error, to, from); only the error matters here.
      await waitForExpect(() => {
        expect(onError.mock.calls[0]?.[0]).toEqual(new Error('token endpoint exploded'))
      })
    })

    it('works as a per-route beforeEnter guard', async () => {
      const okta = createOktaClient({ orchestrator })
      router = createRouter({
        history: createWebHistory(),
        routes: [
          { path: '/', component: { template: 'Home' } },
          {
            path: '/protected',
            component: Protected,
            meta: { requiresAuth: true },
            beforeEnter: createAuthGuard(orchestrator)
          }
        ]
      })
      wrapper = mount(AppWithRoutes, { global: { plugins: [router, okta] } })

      router.push({ path: '/protected' })
      await router.isReady()
      expect(orchestrator.getToken).toHaveBeenCalled()
      expect(wrapper.get('[data-test="protected"]').text()).toBe('protected')
    })
  })
})
