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

import { inject } from 'vue'
import { mount } from '@vue/test-utils'
import { createOktaClient, OktaClientKey } from '../../../src/client-js'
import { FetchClient, addEnv, createOrchestrator, createSignOutFlow } from '../../mocks'

const PKG = require('../../../package.json')

describe('createOktaClient', () => {
  let orchestrator

  beforeEach(() => {
    orchestrator = createOrchestrator()
    addEnv.mockClear()
  })

  it('throws without an orchestrator', () => {
    expect(() => createOktaClient()).toThrow('No orchestrator passed to createOktaClient.')
    expect(() => createOktaClient({})).toThrow('No orchestrator passed to createOktaClient.')
  })

  it('defaults the fetchClient to one built from the same orchestrator', () => {
    const okta = createOktaClient({ orchestrator })
    expect(okta.fetchClient).toBeInstanceOf(FetchClient)
    expect(okta.fetchClient.orchestrator).toBe(orchestrator)
  })

  it('keeps a fetchClient that was passed in', () => {
    const fetchClient = { fetch: jest.fn() }
    expect(createOktaClient({ orchestrator, fetchClient }).fetchClient).toBe(fetchClient)
  })

  it('exposes the instances it was built from', () => {
    const signOutFlow = createSignOutFlow()
    const restoreOriginalUri = jest.fn()
    const okta = createOktaClient({ orchestrator, signOutFlow, restoreOriginalUri })

    expect(okta.orchestrator).toBe(orchestrator)
    expect(okta.signOutFlow).toBe(signOutFlow)
    expect(okta.restoreOriginalUri).toBe(restoreOriginalUri)
  })

  it('exposes a guard bound to the same orchestrator', async () => {
    const okta = createOktaClient({ orchestrator })
    await okta.authGuard({ matched: [{ meta: { requiresAuth: true } }], fullPath: '/protected' })
    expect(orchestrator.getToken).toHaveBeenCalled()
  })

  describe('install', () => {
    /** Runs a plugin's `install()` by mounting an app with it. */
    function use (okta, setup = () => () => null) {
      mount({ setup }, { global: { plugins: [okta] } })
      return okta
    }

    it('provides its context under OktaClientKey', () => {
      let context
      const okta = use(createOktaClient({ orchestrator }), () => {
        context = inject(OktaClientKey)
        return () => null
      })

      expect(context.orchestrator).toBe(orchestrator)
      expect(context.fetchClient).toBe(okta.fetchClient)
    })

    describe('user agent registration', () => {
      // Both halves of this are module state — `addEnv` appends to a list inside the SDK, and
      // `createOktaClient` guards against registering twice — so clearing the mock isn't enough.
      // Each case needs a module graph that has never registered anything.
      function freshModules () {
        let modules
        jest.isolateModules(() => {
          modules = {
            createOktaClient: require('../../../src/client-js').createOktaClient,
            addEnv: require('@okta/spa-platform').addEnv
          }
        })
        return modules
      }

      it('registers the SDK with the Okta user agent', () => {
        const modules = freshModules()

        use(modules.createOktaClient({ orchestrator }))

        expect(modules.addEnv).toHaveBeenCalledWith(`${PKG.name}/${PKG.version}`)
      })

      // Two `app.use(okta)` calls — multiple apps on a page, or a test suite mounting repeatedly —
      // would otherwise repeat the string in the `X-Okta-User-Agent-Extended` header of every request.
      it('registers it only once, however many times install() runs', () => {
        const modules = freshModules()
        const okta = use(modules.createOktaClient({ orchestrator }))

        use(okta)
        use(modules.createOktaClient({ orchestrator }))

        expect(modules.addEnv).toHaveBeenCalledTimes(1)
      })
    })
  })
})
