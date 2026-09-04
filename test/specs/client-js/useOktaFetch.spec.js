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

import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import waitForExpect from 'wait-for-expect'
import { createOktaClient, useOktaFetch, useOktaFetchClient } from '../../../src/client-js'
import { createOrchestrator, createResponse } from '../../mocks'

describe('useOktaFetch', () => {
  let orchestrator
  let fetchClient

  beforeEach(() => {
    orchestrator = createOrchestrator()
    fetchClient = { fetch: jest.fn().mockResolvedValue(createResponse({ body: { hello: 'world' } })) }
  })

  /** Runs a composable inside a real `setup()`, since these are `inject()`s under the hood. */
  function setup (composable) {
    let result
    const wrapper = mount(
      {
        setup () {
          result = composable()
          return () => null
        }
      },
      { global: { plugins: [createOktaClient({ orchestrator, fetchClient })] } }
    )
    return { result, wrapper }
  }

  describe('useOktaFetchClient', () => {
    it('returns the client the plugin was configured with', () => {
      expect(setup(useOktaFetchClient).result).toBe(fetchClient)
    })

    it('throws when the plugin was never installed', () => {
      // `render` as well as `setup`, so the failed setup doesn't also trip Vue's
      // "component is missing template or render function" warning.
      expect(() => mount({
        setup: () => useOktaFetchClient(),
        render: () => null
      })).toThrow(/No Okta client found/)
    })
  })

  it('fetches immediately and exposes the parsed body', async () => {
    const { result } = setup(() => useOktaFetch('/api/messages'))

    expect(result.isLoading.value).toBe(true)
    await waitForExpect(() => {
      expect(result.data.value).toEqual({ hello: 'world' })
    })
    expect(fetchClient.fetch).toHaveBeenCalledWith('/api/messages', {})
    expect(result.isLoading.value).toBe(false)
    expect(result.error.value).toBeNull()
    expect(result.response.value.ok).toBe(true)
  })

  it('forwards the remaining options as the request init', async () => {
    setup(() => useOktaFetch('/api/messages', {
      method: 'POST',
      scopes: ['openid'],
      immediate: true,
      parse: r => r.json()
    }))

    await waitForExpect(() => {
      expect(fetchClient.fetch).toHaveBeenCalledWith('/api/messages', { method: 'POST', scopes: ['openid'] })
    })
  })

  it('does not fetch when immediate is false', async () => {
    const { result } = setup(() => useOktaFetch('/api/messages', { immediate: false }))

    expect(fetchClient.fetch).not.toHaveBeenCalled()
    expect(result.isLoading.value).toBe(false)

    await result.refresh()
    expect(result.data.value).toEqual({ hello: 'world' })
  })

  it('uses a custom parse function', async () => {
    const response = createResponse()
    response.text = jest.fn().mockResolvedValue('plain text')
    fetchClient.fetch.mockResolvedValue(response)

    const { result } = setup(() => useOktaFetch('/api/messages', { parse: r => r.text() }))

    await waitForExpect(() => {
      expect(result.data.value).toBe('plain text')
    })
    expect(response.json).not.toHaveBeenCalled()
  })

  it('exposes a non-2xx response as the error and clears data', async () => {
    const response = createResponse({ ok: false, status: 403 })
    fetchClient.fetch.mockResolvedValue(response)

    const { result } = setup(() => useOktaFetch('/api/messages'))

    await waitForExpect(() => {
      expect(result.error.value).toBe(response)
    })
    expect(result.data.value).toBeNull()
    expect(result.response.value).toBe(response)
    expect(result.isLoading.value).toBe(false)
    expect(response.json).not.toHaveBeenCalled()
  })

  it('exposes a thrown error and clears data', async () => {
    const failure = new Error('network down')
    fetchClient.fetch.mockRejectedValue(failure)

    const { result } = setup(() => useOktaFetch('/api/messages'))

    await waitForExpect(() => {
      expect(result.error.value).toBe(failure)
    })
    expect(result.data.value).toBeNull()
    expect(result.isLoading.value).toBe(false)
  })

  it('clears a previous error on refresh', async () => {
    fetchClient.fetch.mockRejectedValueOnce(new Error('network down'))
    const { result } = setup(() => useOktaFetch('/api/messages'))

    await waitForExpect(() => {
      expect(result.error.value).toBeInstanceOf(Error)
    })

    await result.refresh()
    expect(result.error.value).toBeNull()
    expect(result.data.value).toEqual({ hello: 'world' })
  })

  it('re-fetches when a reactive resource changes', async () => {
    const userId = ref('1')
    const { result } = setup(() => useOktaFetch(() => `/api/users/${userId.value}`))

    await waitForExpect(() => {
      expect(fetchClient.fetch).toHaveBeenCalledWith('/api/users/1', {})
    })

    userId.value = '2'
    await waitForExpect(() => {
      expect(fetchClient.fetch).toHaveBeenCalledWith('/api/users/2', {})
    })
    expect(result.data.value).toEqual({ hello: 'world' })
  })

  it('accepts a ref as the resource', async () => {
    const resource = ref('/api/one')
    setup(() => useOktaFetch(resource))

    await waitForExpect(() => {
      expect(fetchClient.fetch).toHaveBeenCalledWith('/api/one', {})
    })

    resource.value = '/api/two'
    await waitForExpect(() => {
      expect(fetchClient.fetch).toHaveBeenCalledWith('/api/two', {})
    })
  })

  // A slow first request must not overwrite the result of a later, faster one.
  it('discards an out-of-order response', async () => {
    let resolveFirst
    fetchClient.fetch
      .mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
      .mockResolvedValueOnce(createResponse({ body: { which: 'second' } }))

    const { result } = setup(() => useOktaFetch('/api/messages', { immediate: false }))

    const first = result.refresh()
    const second = result.refresh()
    await second

    expect(result.data.value).toEqual({ which: 'second' })

    resolveFirst(createResponse({ body: { which: 'first' } }))
    await first

    expect(result.data.value).toEqual({ which: 'second' })
    expect(result.isLoading.value).toBe(false)
  })

  // The stale check has to run again after `parse` awaits, not just after `fetch`.
  it('discards a stale response that parses late', async () => {
    let resolveFirstParse
    const firstResponse = createResponse()
    firstResponse.json = jest.fn(() => new Promise(resolve => { resolveFirstParse = resolve }))

    fetchClient.fetch
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(createResponse({ body: { which: 'second' } }))

    const { result } = setup(() => useOktaFetch('/api/messages', { immediate: false }))

    const first = result.refresh()
    // Let the first request get past `fetch` and into `parse` before starting the second.
    await waitForExpect(() => expect(firstResponse.json).toHaveBeenCalled())

    await result.refresh()
    expect(result.data.value).toEqual({ which: 'second' })

    resolveFirstParse({ which: 'first' })
    await first

    expect(result.data.value).toEqual({ which: 'second' })
  })
})
