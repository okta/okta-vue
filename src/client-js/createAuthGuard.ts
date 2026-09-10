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

import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'
import type { AuthorizationCodeFlowOrchestrator } from '@okta/spa-platform'
import type { AuthGuardOptions } from './types'

/**
 * Builds a `vue-router` navigation guard that requires a valid credential before entering any route
 * whose `meta` (or an ancestor's) carries `requiresAuth: true`.
 *
 * There is no persistent auth state to read here — `orchestrator.getToken()` resolves a stored
 * credential, refreshes it if needed, or performs a full-page redirect to Okta if it can't. So the
 * guard has three outcomes:
 *
 * - a credential is available (possibly after a refresh) — the navigation proceeds;
 * - none is available — the orchestrator redirects to Okta and the returned promise never settles,
 *   because the browser unloads first. The navigation is effectively aborted, matching the
 *   `return false` of the `@okta/okta-auth-js`-based `navigationGuard`;
 * - none is available *and* the orchestrator was built with `avoidPrompting: true`, so it declines
 *   to redirect and returns `null` — the guard returns `false` and the navigation is aborted with
 *   nowhere to go. Handle that case with your own guard or a `router.onError` handler.
 *
 * Unexpected failures (a token endpoint error, a flow already in progress) are left to propagate, so
 * `vue-router` surfaces them through `router.onError()` rather than silently aborting.
 *
 * This guard does *not* re-check on credential expiry the way the `okta-auth-js` guard does via
 * `authStateManager.subscribe` — there's no equivalent event to subscribe to. Expiry is instead
 * caught at request time by {@link useOktaFetch}/{@link useOktaFetchClient}, whose `FetchClient`
 * runs the same resolve/refresh/redirect logic before every request.
 *
 * @example
 * ```ts
 * const router = createRouter({
 *   history: createWebHistory(),
 *   routes: [
 *     { path: '/', component: Home },
 *     { path: '/login/callback', component: LoginCallback },
 *     { path: '/protected', component: Protected, meta: { requiresAuth: true } }
 *   ]
 * })
 *
 * router.beforeEach(createAuthGuard(orchestrator))
 * ```
 *
 * @example Guarding a single route instead of the whole app
 * ```ts
 * {
 *   path: '/protected',
 *   component: Protected,
 *   meta: { requiresAuth: true },
 *   beforeEnter: createAuthGuard(orchestrator)
 * }
 * ```
 */
export function createAuthGuard (
  orchestrator: AuthorizationCodeFlowOrchestrator,
  options: AuthGuardOptions = {}
): NavigationGuardWithThis<undefined> {
  if (!orchestrator) {
    throw new Error('No orchestrator passed to createAuthGuard.')
  }

  const { originalUri = (to: RouteLocationNormalized) => to.fullPath, params } = options

  return async function oktaAuthGuard (to) {
    if (!to.matched.some(record => record.meta.requiresAuth)) {
      return true
    }

    // The orchestrator records `originalUri` from its own `getOriginalUri()` at redirect time, and
    // that default reads `window.location` — which, inside a `beforeEach` guard, is still the page
    // being left rather than `to`. The guard is the only place that knows the target route, so it
    // overrides the option for the duration of this call.
    //
    // Restored in `finally`: when `getToken()` *does* redirect the promise never settles and the
    // restore never runs, which is fine — the page is gone. But when it resolves from storage (the
    // common case) the override has to come back off, or every later flow started from outside this
    // guard — a `signIn()` button, a step-up `getToken()`, a second guard with different options —
    // would silently inherit this navigation's target as its `originalUri`.
    const previousGetOriginalUri = orchestrator.options.getOriginalUri
    orchestrator.options.getOriginalUri = () => originalUri(to)

    try {
      const token = await orchestrator.getToken(typeof params === 'function' ? params(to) : params)

      return token !== null
    } finally {
      orchestrator.options.getOriginalUri = previousGetOriginalUri
    }
  }
}
