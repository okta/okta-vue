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

/**
 * Opt-in support for `@okta/okta-client-javascript` (`@okta/auth-foundation` +
 * `@okta/oauth2-flows` + `@okta/spa-platform`), as an alternative to `@okta/okta-auth-js`.
 *
 * Nothing here is reachable from `@okta/okta-vue`'s default entry point, and none of the three
 * packages above are required unless you import from this subpath.
 */

export { createOktaClient } from './createOktaClient'
export { createAuthGuard } from './createAuthGuard'
export { useOktaAuth } from './useOktaAuth'
export { useOktaFetch, useOktaFetchClient } from './useOktaFetch'
export { OktaClientKey } from './context'
export { default as LoginCallback } from './components/LoginCallback.vue'
export * from './types'
