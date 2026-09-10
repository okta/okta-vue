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

import { getCurrentInstance, onUnmounted, readonly, ref, shallowReadonly, shallowRef, unref, watch } from 'vue'
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
 * Combines the composable's own per-request `AbortController` with a `signal` the caller passed
 * through `options`, so either can cancel the request.
 *
 * `AbortSignal.any()` does exactly this, but it only reached every evergreen browser in early 2024;
 * the manual fallback keeps the composable working on older ones. The returned `release` detaches the
 * listener once the request settles, so repeated `refresh()` calls can't pile up listeners on a
 * long-lived caller signal.
 */
function linkSignal (
  controller: AbortController,
  external?: AbortSignal | null
): { signal: AbortSignal, release: () => void } {
  // Nothing to detach on the paths that never attach a listener.
  const noop = (): void => undefined

  if (!external) {
    return { signal: controller.signal, release: noop }
  }

  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any([external, controller.signal]), release: noop }
  }

  if (external.aborted) {
    controller.abort(external.reason)
    return { signal: controller.signal, release: noop }
  }

  const forward = () => controller.abort(external.reason)
  external.addEventListener('abort', forward)

  return {
    signal: controller.signal,
    release: () => external.removeEventListener('abort', forward)
  }
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
 * Pass a `ref` or getter as `resource` and the request re-runs whenever it changes. The previous
 * request is aborted, and responses that still arrive out of order are discarded, so `data` always
 * reflects the latest request. The in-flight request is also aborted when the owning component
 * unmounts.
 *
 * The four state values come back as readonly refs: they're outputs, and a consumer write to
 * `data.value` would be silently clobbered by the next fetch. Use `refresh()` to re-run the request.
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

  // Monotonic id so a slow earlier request can't overwrite a faster later one. Still needed now that
  // requests are aborted: `abort()` rejects the *fetch*, but a request already past `fetch()` and
  // awaiting inside `parse()` would otherwise still publish.
  let latestRequestId = 0
  let inFlight: AbortController | undefined

  const abortInFlight = () => {
    inFlight?.abort()
    inFlight = undefined
  }

  const refresh = async () => {
    // Cancel the superseded request rather than only ignoring its result: without this the socket
    // stays open and the body is downloaded and thrown away, which on a fast-changing route param
    // is a steady stream of wasted requests.
    abortInFlight()

    const requestId = ++latestRequestId
    const controller = new AbortController()
    inFlight = controller

    const { signal, release } = linkSignal(controller, init.signal)

    // A request cancelled by us — superseded by a later `refresh()`, or the component unmounted —
    // isn't something the consumer needs to see. One aborted through a `signal` they passed in is,
    // since they asked for it.
    const cancelledByUs = () => controller.signal.aborted && init.signal?.aborted !== true

    isLoading.value = true
    error.value = null

    try {
      const result = await fetchClient.fetch(toValue(resource), { ...init, signal })

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
      if (requestId !== latestRequestId || cancelledByUs()) {
        return
      }

      data.value = null
      // Nothing was received, so the previous response must not be left standing: otherwise
      // `error != null && response != null && data == null` is reachable and reads as contradictory.
      response.value = null
      error.value = e
    } finally {
      release()

      if (inFlight === controller) {
        inFlight = undefined
      }

      if (requestId === latestRequestId) {
        isLoading.value = false
      }
    }
  }

  // `immediate` is forwarded to `watch` rather than gating whether a watcher exists at all: it means
  // "fire on setup too" everywhere else in Vue, so `immediate: false` must still re-fetch when a
  // reactive `resource` changes.
  watch(() => toValue(resource), refresh, { immediate })

  // `onScopeDispose` is the natural hook, but it only exists from Vue 3.2 and this subpath supports
  // the full `vue@^3.0.0` peer range. `onUnmounted` warns when called with no component instance
  // (a composable invoked from a plain effect scope, or a bare unit test), hence the guard.
  if (getCurrentInstance()) {
    onUnmounted(abortInFlight)
  }

  return {
    data: shallowReadonly(data),
    error: shallowReadonly(error),
    isLoading: readonly(isLoading),
    response: shallowReadonly(response),
    refresh
  }
}
