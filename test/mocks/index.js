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

// Re-exported from the mapped module rather than re-declared, so specs share the one `addEnv` mock
// instance that src/client-js/ imports.
export { FetchClient, addEnv } from '@okta/spa-platform'

/**
 * An `AuthorizationCodeFlowOrchestrator` double.
 *
 * `options` is a real mutable object because `createAuthGuard` installs `options.getOriginalUri` onto
 * it for the duration of its `getToken()` call. Since the guard restores the previous value
 * afterwards, specs capture it from inside a `getToken` implementation rather than reading it after
 * the guard resolves.
 */
export function createOrchestrator (overrides = {}) {
  return {
    options: {},
    getToken: jest.fn().mockResolvedValue({ accessToken: { rawValue: 'fake-access-token' } }),
    resumeFlow: jest.fn().mockResolvedValue({ originalUri: '/protected' }),
    selectCredential: jest.fn().mockResolvedValue(null),
    ...overrides
  }
}

/** A `Credential` double, as returned by `orchestrator.selectCredential()`. */
export function createCredential ({ idToken = 'fake-id-token' } = {}) {
  return {
    token: {
      idToken: idToken === null ? undefined : { rawValue: idToken }
    },
    revoke: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined)
  }
}

/** A `SessionLogoutFlow` double. `start()` resolves a `URL`, as the real one does. */
export function createSignOutFlow (logoutUrl = 'https://foo/oauth2/v1/logout?id_token_hint=fake-id-token') {
  return {
    start: jest.fn().mockResolvedValue(new URL(logoutUrl))
  }
}

/** A `Response` double, avoiding a dependency on jsdom's fetch implementation. */
export function createResponse ({ ok = true, status = ok ? 200 : 500, body = null } = {}) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body)
  }
}
