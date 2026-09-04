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
import { createOktaClient, useOktaAuth } from '../../../src/client-js'
import { navigate } from '../../../src/client-js/navigate'
import { createCredential, createOrchestrator, createSignOutFlow } from '../../mocks'

// `window.location` is unforgeable in jsdom, so the redirect out of the SPA lives behind this
// module — see src/client-js/navigate.ts.
jest.mock('../../../src/client-js/navigate')

describe('useOktaAuth', () => {
  let orchestrator

  beforeEach(() => {
    orchestrator = createOrchestrator()
    navigate.mockClear()
  })

  /** Runs `useOktaAuth()` inside a real `setup()`, since it is an `inject()` under the hood. */
  function setup (options = {}) {
    let auth
    mount(
      {
        setup () {
          auth = useOktaAuth()
          return () => null
        }
      },
      { global: { plugins: [createOktaClient({ orchestrator, ...options })] } }
    )
    return auth
  }

  it('throws when the plugin was never installed', () => {
    // `render` as well as `setup`, so the failed setup doesn't also trip Vue's
    // "component is missing template or render function" warning.
    expect(() => mount({
      setup: () => useOktaAuth(),
      render: () => null
    })).toThrow(/No Okta client found/)
  })

  it('exposes the orchestrator it was configured with', () => {
    expect(setup().orchestrator).toBe(orchestrator)
  })

  describe('getToken', () => {
    it('delegates to the orchestrator', async () => {
      const token = await setup().getToken({ scopes: ['openid'] })
      expect(orchestrator.getToken).toHaveBeenCalledWith({ scopes: ['openid'] })
      expect(token).toEqual({ accessToken: { rawValue: 'fake-access-token' } })
    })

    it('returns null when the orchestrator declines to prompt', async () => {
      orchestrator.getToken.mockResolvedValue(null)
      await expect(setup().getToken()).resolves.toBeNull()
    })
  })

  describe('signIn', () => {
    it('resolves a token and returns nothing', async () => {
      await expect(setup().signIn()).resolves.toBeUndefined()
      expect(orchestrator.getToken).toHaveBeenCalled()
    })

    it('forwards authorize params', async () => {
      await setup().signIn({ acrValues: 'urn:okta:loa:2fa:any' })
      expect(orchestrator.getToken).toHaveBeenCalledWith({ acrValues: 'urn:okta:loa:2fa:any' })
    })
  })

  describe('signOut', () => {
    let signOutFlow
    let credential

    beforeEach(() => {
      signOutFlow = createSignOutFlow()
      credential = createCredential()
      orchestrator.selectCredential.mockResolvedValue(credential)
    })

    it('throws when no signOutFlow was configured', async () => {
      await expect(setup().signOut()).rejects
        .toThrow('No signOutFlow available. Pass a `SessionLogoutFlow` to createOktaClient() to use signOut().')
    })

    it('revokes the credential and redirects to the logout endpoint', async () => {
      await setup({ signOutFlow }).signOut()

      expect(credential.revoke).toHaveBeenCalledWith('ALL')
      expect(credential.remove).not.toHaveBeenCalled()
      expect(signOutFlow.start).toHaveBeenCalledWith('fake-id-token')
      // `.href`, not the URL object: two distinct URLs compare equal under jest's recursive
      // equality, because everything on a URL is a prototype getter rather than an own property.
      expect(navigate.mock.calls[0][0].href).toBe('https://foo/oauth2/v1/logout?id_token_hint=fake-id-token')
    })

    it('only clears local state when revokeTokens is false', async () => {
      await setup({ signOutFlow }).signOut({ revokeTokens: false })

      expect(credential.remove).toHaveBeenCalled()
      expect(credential.revoke).not.toHaveBeenCalled()
      expect(navigate).toHaveBeenCalled()
    })

    it('does not redirect when there is no credential to log out', async () => {
      orchestrator.selectCredential.mockResolvedValue(null)
      await expect(setup({ signOutFlow }).signOut()).resolves.toBeUndefined()

      expect(signOutFlow.start).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    it('clears the credential but does not redirect when it carries no id_token', async () => {
      const withoutIdToken = createCredential({ idToken: null })
      orchestrator.selectCredential.mockResolvedValue(withoutIdToken)

      await setup({ signOutFlow }).signOut()

      expect(withoutIdToken.revoke).toHaveBeenCalledWith('ALL')
      expect(signOutFlow.start).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
    })

    // The id_token is needed to build the logout URL, so it has to be read before the credential is
    // revoked and dropped from storage.
    it('reads the id_token before clearing the credential', async () => {
      credential.revoke.mockImplementation(async () => {
        credential.token.idToken = undefined
      })

      await setup({ signOutFlow }).signOut()

      expect(signOutFlow.start).toHaveBeenCalledWith('fake-id-token')
    })
  })
})
