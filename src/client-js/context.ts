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

import { inject, type InjectionKey } from 'vue'
import type { OktaClientContext } from './types'

/**
 * The key `createOktaClient()` provides its context under. Exported for consumers who'd rather
 * `inject(OktaClientKey)` directly than go through this SDK's composables.
 */
export const OktaClientKey: InjectionKey<OktaClientContext> = Symbol('okta.client')

/**
 * Reads the context installed by `createOktaClient()`. Must be called from a `setup()` function or
 * another composable, like any `inject()`.
 *
 * @internal
 */
export function injectOktaClient (): OktaClientContext {
  const context = inject(OktaClientKey, null)

  if (!context) {
    throw new Error(
      'No Okta client found. Install the plugin with `app.use(createOktaClient({ orchestrator }))`, ' +
      'and call Okta composables from within `setup()`.'
    )
  }

  return context
}
