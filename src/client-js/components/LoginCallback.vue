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

<script lang="ts">
import { h, ref, onBeforeMount, type Slot } from 'vue'
import { useRouter } from 'vue-router'
import { injectOktaClient } from '../context'

/**
 * Route component for the OAuth redirect URI. Completes the authorization code exchange, then sends
 * the user on to wherever they were headed.
 *
 * `orchestrator.resumeFlow()` stores the resulting credential itself, so nothing here writes to
 * storage — it only handles the redirect afterwards. `originalUri` is read off the flow context,
 * which is the `meta` object recorded when the flow started; `createAuthGuard` puts `to.fullPath`
 * there. If you start flows yourself with a different `meta` shape, pass `restoreOriginalUri` to
 * `createOktaClient()` and read your own keys.
 *
 * Errors are surfaced the same way as the okta-auth-js `LoginCallback`: through an `error` scoped
 * slot if you provide one, otherwise rendered as plain text.
 *
 * @example
 * ```ts
 * { path: '/login/callback', component: LoginCallback }
 * ```
 *
 * @example
 * ```vue
 * <LoginCallback>
 *   <template #error="{ error }">
 *     <p v-if="error">Sign-in failed: {{ error }}</p>
 *   </template>
 * </LoginCallback>
 * ```
 */
export default {
  name: 'LoginCallback',
  setup (_props: Record<string, never>, { slots }: { slots: { error?: Slot } }) {
    const error = ref<string | null>(null)
    const { orchestrator, restoreOriginalUri } = injectOktaClient()
    const router = useRouter()

    onBeforeMount(async () => {
      try {
        const context = await orchestrator.resumeFlow(window.location.href)
        const originalUri = typeof context?.originalUri === 'string' ? context.originalUri : '/'

        if (restoreOriginalUri) {
          await restoreOriginalUri(originalUri)
        } else if (router) {
          await router.replace(toRelativeUri(originalUri))
        }
      } catch (e) {
        error.value = String(e)
      }
    })

    return () => {
      if (slots.error) {
        return h('div', slots.error({ error: error.value }))
      }
      return error.value
    }
  }
}

/**
 * Reduces `originalUri` to a router-navigable path. Anything pointing off-origin (or unparseable)
 * collapses to `/` rather than being handed to the router as-is.
 */
function toRelativeUri (uri: string): string {
  try {
    const url = new URL(uri, window.location.origin)
    return url.origin === window.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : '/'
  } catch {
    return '/'
  }
}
</script>
