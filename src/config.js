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

import {
  assertIssuer,
  assertClientId,
  assertRedirectUri,
  buildConfigObject
} from '@okta/configuration-validation'

export default function initConfig (options) {
  // Normalize config object
  let auth = buildConfigObject(options)

  // Assert configuration
  assertIssuer(auth.issuer, auth.testing)
  assertClientId(auth.clientId)
  assertRedirectUri(auth.redirectUri)

  // Default scopes, override as needed
  auth.scopes = auth.scopes || ['openid', 'email', 'profile']
  // Force 'openid' as a scope
  if (!auth.scopes.includes('openid')) {
    auth.scopes.unshift('openid')
  }

  // Set default responseType if not specified
  auth.responseType = auth.responseType || ['id_token', 'token']

  return auth
}
