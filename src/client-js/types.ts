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

import type { App, Ref } from 'vue'
import type { NavigationGuardWithThis, RouteLocationNormalized } from 'vue-router'
import type {
  AuthorizationCodeFlowOrchestrator,
  FetchClient,
  SessionLogoutFlow,
  Token,
  TokenOrchestrator
} from '@okta/spa-platform'

/**
 * A value, a `ref` to a value, or a getter returning a value.
 *
 * Declared locally rather than imported from `vue` so this subpath keeps working on the full
 * `vue@^3.0.0` peer range — `MaybeRefOrGetter`/`toValue` only landed in Vue 3.3.
 */
export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T)

/** The resource accepted by {@link FetchClient.fetch}. */
export type OktaFetchResource = Parameters<FetchClient['fetch']>[0]

/**
 * The options bag accepted by {@link FetchClient.fetch} — a `RequestInit` intersected with
 * {@link TokenOrchestrator.AuthorizeParams} (`scopes`, `acrValues`, …) and `authorizeRequest`.
 */
export type OktaFetchInit = NonNullable<Parameters<FetchClient['fetch']>[1]>

export interface OktaClientOptions {
  /**
   * The orchestrator every other piece of this SDK derives from. It resolves a stored credential,
   * refreshes it when needed, or triggers a full redirect to Okta when it can't.
   */
  orchestrator: AuthorizationCodeFlowOrchestrator

  /**
   * Client used by {@link useOktaFetch} and {@link useOktaFetchClient}.
   *
   * Defaults to `new FetchClient(orchestrator)`. Pass your own only when you need non-default
   * `APIClient` configuration (`dpop`, `fetchImpl`) or request interceptors — and construct it from
   * the *same* `orchestrator` you pass above, or the credential written by the login-callback route
   * won't be the one your requests read back.
   */
  fetchClient?: FetchClient

  /**
   * Required for {@link useOktaAuth}'s `signOut()`. Without it, `signOut()` throws.
   */
  signOutFlow?: SessionLogoutFlow

  /**
   * Called by `<LoginCallback />` once the authorization code exchange succeeds, with the
   * `originalUri` recorded when the flow started.
   *
   * Defaults to `router.replace()` against the app's `vue-router` instance.
   */
  restoreOriginalUri?: (originalUri: string) => void | Promise<void>
}

/**
 * The value provided under {@link OktaClientKey}. Injected by this SDK's composables and by
 * `<LoginCallback />`.
 */
export interface OktaClientContext {
  readonly orchestrator: AuthorizationCodeFlowOrchestrator
  readonly fetchClient: FetchClient
  readonly signOutFlow?: SessionLogoutFlow
  readonly restoreOriginalUri?: (originalUri: string) => void | Promise<void>
}

/**
 * The object returned by {@link createOktaClient}: a Vue plugin that also exposes the instances it
 * was built from, plus a ready-made navigation guard bound to the same orchestrator.
 */
export interface OktaClient extends OktaClientContext {
  /**
   * Vue plugin hook, so the object returned by {@link createOktaClient} can be handed straight to
   * `app.use()`. Declared structurally rather than by extending Vue's `Plugin` type, which is a
   * union and has changed shape across the `vue@^3.0.0` peer range.
   */
  install: (app: App) => void

  /**
   * A `vue-router` guard bound to this client's `orchestrator`, equivalent to
   * `createAuthGuard(orchestrator)`. Registering this one instead of building your own removes any
   * chance of guarding with a different orchestrator than the one the login-callback route stores
   * its credential on.
   */
  readonly authGuard: NavigationGuardWithThis<undefined>
}

export interface AuthGuardOptions {
  /**
   * Where the user should land after signing in. Defaults to `to => to.fullPath`, matching the
   * `setOriginalUri(to.fullPath)` behavior of the `@okta/okta-auth-js`-based `navigationGuard`.
   *
   * The guard installs this onto `orchestrator.options.getOriginalUri` for the duration of its
   * `getToken()` call and restores the previous value afterwards, because only the guard knows the
   * route being *entered* — the orchestrator's own default can only read `window.location`, which
   * during a `beforeEach` guard is still the page being left. To keep the orchestrator's default
   * instead, pass `() => toRelativeUrl(window.location.href)`.
   */
  originalUri?: (to: RouteLocationNormalized) => string

  /**
   * Extra `AuthorizeParams` (`scopes`, `acrValues`, `maxAge`, …) for the guard's `getToken()` call.
   * Pass a function to derive them per-route, e.g. `to => ({ scopes: to.meta.scopes })`.
   */
  params?: TokenOrchestrator.AuthorizeParams | ((to: RouteLocationNormalized) => TokenOrchestrator.AuthorizeParams)
}

export interface SignOutOptions {
  /**
   * Revoke the tokens at the authorization server before redirecting to Okta's logout endpoint.
   * Defaults to `true`, matching `okta-auth-js`'s `signOut()`. When `false` the credential is only
   * dropped from local storage.
   */
  revokeTokens?: boolean
}

export interface UseOktaAuthReturn {
  /** The orchestrator this app was configured with — the escape hatch for anything not wrapped here. */
  readonly orchestrator: AuthorizationCodeFlowOrchestrator

  /**
   * Resolves a stored credential, refreshing it if needed, or triggers a full redirect to Okta if
   * there's nothing usable.
   *
   * When a redirect happens the returned promise never settles — the browser navigates away first.
   * `null` comes back only when the orchestrator was built with `avoidPrompting: true` and declined
   * to redirect.
   */
  getToken: (params?: TokenOrchestrator.AuthorizeParams) => Promise<Token | null>

  /**
   * Intent-named wrapper over {@link UseOktaAuthReturn.getToken} for "Sign in" buttons. Resolves
   * without navigating if a usable credential already exists.
   */
  signIn: (params?: TokenOrchestrator.AuthorizeParams) => Promise<void>

  /**
   * Revokes and clears the stored credential, then redirects to Okta's logout endpoint.
   *
   * Requires `signOutFlow` on {@link OktaClientOptions}. If no credential with an `id_token` is
   * stored there is nothing to perform RP-initiated logout with, so this clears local state and
   * resolves without navigating.
   */
  signOut: (options?: SignOutOptions) => Promise<void>
}

export type UseOktaFetchOptions<T> = OktaFetchInit & {
  /**
   * Fetch on setup. Defaults to `true`; pass `false` to defer the first request to the returned
   * `refresh()`.
   *
   * This only controls the *first* request, matching what `immediate` means everywhere else in Vue.
   * A reactive `resource` still re-fetches when it changes either way.
   */
  immediate?: boolean

  /**
   * Turns a successful `Response` into `data`. Defaults to `response => response.json()`.
   */
  parse?: (response: Response) => Promise<T>
}

/**
 * The reactive state returned by {@link useOktaFetch}.
 *
 * All four state refs are readonly: they are outputs of the request, and a consumer write would be
 * silently overwritten by the next fetch. Re-run the request with `refresh()` instead.
 */
export interface UseOktaFetchReturn<T> {
  /** The parsed body of the most recent successful response, or `null`. */
  data: Readonly<Ref<T | null>>

  /**
   * The thrown error, or — for a non-2xx response — the `Response` itself. `null` while the request
   * is in flight and after it succeeds.
   *
   * A request aborted because a newer one superseded it, or because the component unmounted, is not
   * reported here. One aborted through a `signal` you passed in yourself is.
   */
  error: Readonly<Ref<unknown>>

  /** `true` from the moment a request starts until it settles. */
  isLoading: Readonly<Ref<boolean>>

  /** The most recent `Response`, whether or not it was successful. `null` if the request threw. */
  response: Readonly<Ref<Response | null>>

  /** Re-runs the request, aborting any still in flight. Resolves once `data`/`error` reflect the result. */
  refresh: () => Promise<void>
}
