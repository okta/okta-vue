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

import { ref, shallowRef, unref, watch } from 'vue'
import type { FetchClient } from '@okta/spa-platform'
import { injectOktaClient } from './context'
import type {
  MaybeRefOrGetter,
  OktaFetchResource,
  UseOktaFetchOptions,
  UseOktaFetchReturn
} from './types'

/**
 * Local stand-in for Vue 3.3's `toValue`, so this subpath keeps working across the full
 * `vue@^3.0.0` peer range.
 */
function toValue<T> (source: MaybeRefOrGetter<T>): T {
  return typeof source === 'function' ? (source as () => T)() : unref(source)
}

/**
 * The `FetchClient` installed by `createOktaClient()`, for imperative requests — form submissions,
 * button handlers, anything that shouldn't run on setup.
 *
 * `fetchClient.fetch()` resolves a credential, refreshes it if needed, or performs a full redirect
 * to Okta if it can't, all before the request goes out. There is no separate "am I signed in?" check
 * to make first.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const fetchClient = useOktaFetchClient()
 *
 * async function save (payload: Profile) {
 *   await fetchClient.fetch('/api/profile', {
 *     method: 'POST',
 *     body: JSON.stringify(payload),
 *     headers: { 'Content-Type': 'application/json' }
 *   })
 * }
 * </script>
 * ```
 */
export function useOktaFetchClient (): FetchClient {
  return injectOktaClient().fetchClient
}

/**
 * Fetches an authenticated resource and exposes it as reactive state.
 *
 * Pass a `ref` or getter as `resource` and the request re-runs whenever it changes; responses that
 * arrive out of order are discarded so `data` always reflects the latest request.
 *
 * Because the underlying `FetchClient` re-authenticates on demand, a component using this composable
 * can trigger a full-page redirect to Okta during setup when no credential can be resolved. That is
 * by design on this path — for routes where you'd rather resolve auth before the component mounts at
 * all, guard the route with {@link createAuthGuard} as well.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useOktaFetch } from '@okta/okta-vue/client-js'
 *
 * const { data, error, isLoading } = useOktaFetch<Message[]>('/api/messages')
 * </script>
 *
 * <template>
 *   <p v-if="isLoading">Loading…</p>
 *   <p v-else-if="error">Could not load messages.</p>
 *   <ul v-else><li v-for="m in data" :key="m.id">{{ m.text }}</li></ul>
 * </template>
 * ```
 *
 * @example Re-fetching when a route param changes
 * ```ts
 * const route = useRoute()
 * const { data } = useOktaFetch(() => `/api/users/${route.params.userId}/messages`)
 * ```
 */
export function useOktaFetch<T = unknown> (
  resource: MaybeRefOrGetter<OktaFetchResource>,
  options: UseOktaFetchOptions<T> = {}
): UseOktaFetchReturn<T> {
  const fetchClient = useOktaFetchClient()

  const {
    immediate = true,
    parse = (response: Response) => response.json() as Promise<T>,
    ...init
  } = options

  const data = shallowRef<T | null>(null)
  const error = shallowRef<unknown>(null)
  const response = shallowRef<Response | null>(null)
  const isLoading = ref(false)

  // Monotonic id so a slow earlier request can't overwrite a faster later one.
  let latestRequestId = 0

  const refresh = async () => {
    const requestId = ++latestRequestId
    isLoading.value = true
    error.value = null

    try {
      const result = await fetchClient.fetch(toValue(resource), init)

      if (requestId !== latestRequestId) {
        return
      }

      response.value = result

      if (result.ok) {
        const parsed = await parse(result)

        // `parse` awaits too, so re-check before publishing.
        if (requestId !== latestRequestId) {
          return
        }

        data.value = parsed
      } else {
        data.value = null
        error.value = result
      }
    } catch (e) {
      if (requestId !== latestRequestId) {
        return
      }

      data.value = null
      error.value = e
    } finally {
      if (requestId === latestRequestId) {
        isLoading.value = false
      }
    }
  }

  if (immediate) {
    watch(() => toValue(resource), refresh, { immediate: true })
  }

  return { data, error, isLoading, response, refresh }
}
