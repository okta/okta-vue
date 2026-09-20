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

import type { TokenOrchestrator } from '@okta/spa-platform'
import { injectOktaClient } from './context'
import { navigate } from './navigate'
import type { SignOutOptions, UseOktaAuthReturn } from './types'

/**
 * Exposes the orchestrator installed by `createOktaClient()`, plus sign-in and sign-out helpers.
 *
 * Note what is *not* here: there is no `isAuthenticated` ref. `@okta/okta-client-javascript` keeps
 * no persistent auth state, so any such ref would be a snapshot that silently goes stale. Gate
 * routes with {@link createAuthGuard} and fetch data with {@link useOktaFetch} — both re-resolve
 * authentication at the moment it matters.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useOktaAuth } from '@okta/okta-vue/client-js'
 *
 * const { signIn, signOut } = useOktaAuth()
 * </script>
 *
 * <template>
 *   <button @click="signIn()">Sign in</button>
 *   <button @click="signOut()">Sign out</button>
 * </template>
 * ```
 */
export function useOktaAuth (): UseOktaAuthReturn {
  const { orchestrator, signOutFlow } = injectOktaClient()

  const getToken = (params?: TokenOrchestrator.AuthorizeParams) => orchestrator.getToken(params)

  const signIn = async (params?: TokenOrchestrator.AuthorizeParams) => {
    await getToken(params)
  }

  const signOut = async ({ revokeTokens = true }: SignOutOptions = {}) => {
    if (!signOutFlow) {
      throw new Error(
        'No signOutFlow available. Pass a `SessionLogoutFlow` to createOktaClient() to use signOut().'
      )
    }

    const credential = await orchestrator.selectCredential({})

    // Read the raw id_token before clearing the credential — it's required to build the logout URL.
    const idToken = credential?.token.idToken?.rawValue

    if (credential) {
      // `revoke('ALL')` removes the credential from storage on top of revoking at the AS, so the
      // two branches are equivalent locally and differ only in whether the AS is told.
      await (revokeTokens ? credential.revoke('ALL') : credential.remove())
    }

    if (!idToken) {
      // Nothing to perform RP-initiated logout with. Local state is already cleared.
      return
    }

    navigate(await signOutFlow.start(idToken))
  }

  return { orchestrator, getToken, signIn, signOut }
}
