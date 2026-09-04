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

import type { App } from 'vue'
// `addEnv` is re-exported from `@okta/spa-platform`'s root alongside the rest of
// `@okta/auth-foundation/core`. It's the client-js equivalent of
// `oktaAuth._oktaUserAgent.addEnvironment()` on the okta-auth-js path.
import { FetchClient, addEnv } from '@okta/spa-platform'
import { OktaClientKey } from './context'
import { createAuthGuard } from './createAuthGuard'
import type { OktaClient, OktaClientContext, OktaClientOptions } from './types'

// constants are defined in rollup.config.js
declare const PACKAGE: {
  name: string;
  version: string;
}

/**
 * Creates the `@okta/okta-client-javascript` plugin for a Vue app.
 *
 * Everything this SDK offers is derived from the single `orchestrator` you pass in: the navigation
 * guard that protects routes, the `FetchClient` behind {@link useOktaFetch}, and the credential
 * `<LoginCallback />` stores on the redirect route. Deriving them from one instance is deliberate —
 * a guard reading one orchestrator while the callback route writes to another would break the
 * credential handoff with no error to show for it.
 *
 * Unlike the default `@okta/okta-vue` entry point, this plugin exposes no reactive `authState` and
 * no `$auth` global property. `@okta/okta-client-javascript` has no persistent auth-state object:
 * authentication is resolved, refreshed, or re-triggered on demand — before each guarded navigation
 * and before each request — so there is nothing meaningful to hold in a `ref`.
 *
 * @example
 * ```ts
 * // okta.ts
 * import { AuthorizationCodeFlow, AuthorizationCodeFlowOrchestrator, OAuth2Client, SessionLogoutFlow } from '@okta/spa-platform'
 * import { createOktaClient } from '@okta/okta-vue/client-js'
 *
 * const client = new OAuth2Client({ issuer, clientId })
 * const signInFlow = new AuthorizationCodeFlow(client, { redirectUri: `${window.location.origin}/login/callback` })
 * const signOutFlow = new SessionLogoutFlow(client, { logoutRedirectUri: window.location.origin })
 *
 * export const orchestrator = new AuthorizationCodeFlowOrchestrator(signInFlow)
 * export const okta = createOktaClient({ orchestrator, signOutFlow })
 *
 * // main.ts
 * app.use(router)
 * app.use(okta)
 * ```
 */
export function createOktaClient (options: OktaClientOptions): OktaClient {
  const { orchestrator, fetchClient, signOutFlow, restoreOriginalUri } = options ?? {} as OktaClientOptions

  if (!orchestrator) {
    throw new Error('No orchestrator passed to createOktaClient.')
  }

  const context: OktaClientContext = {
    orchestrator,
    fetchClient: fetchClient ?? new FetchClient(orchestrator),
    signOutFlow,
    restoreOriginalUri
  }

  return {
    ...context,

    authGuard: createAuthGuard(orchestrator),

    install (app: App) {
      addEnv(`${PACKAGE.name}/${PACKAGE.version}`)
      app.provide(OktaClientKey, context)
    }
  }
}
