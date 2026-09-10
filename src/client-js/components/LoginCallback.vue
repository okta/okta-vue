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

<script setup lang="ts">
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
 * Errors are surfaced through an `error` scoped slot if you provide one, otherwise rendered as plain
 * text. The slot receives the thrown value itself rather than a pre-stringified message, so
 * consumers can branch on an OAuth error code or `error.name`; Vue's own interpolation already
 * renders an `Error` through `String()`, so `{{ error }}` reads the same either way.
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
import { onBeforeMount, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { injectOktaClient } from '../context'
import { toRelativeUri } from '../toRelativeUri'

defineOptions({ name: 'LoginCallback' })

const error = shallowRef<unknown>(null)
const { orchestrator, restoreOriginalUri } = injectOktaClient()
const router = useRouter()

onBeforeMount(async () => {
  try {
    const context = await orchestrator.resumeFlow(window.location.href)
    const originalUri = typeof context?.originalUri === 'string' ? context.originalUri : '/'

    if (restoreOriginalUri) {
      // Handed the recorded value as-is: the consumer owns the navigation and may well want the
      // absolute URL. Only the router path below has to be same-origin and relative.
      await restoreOriginalUri(originalUri)
      return
    }

    // No `if (router)` guard: this is a route component, so a router is installed by definition.
    // Were it somehow missing, `useRouter()` returns `undefined` and the resulting `TypeError`
    // surfaces through the `catch` below — which beats completing the token exchange and then
    // silently stranding the user on the callback URL with nothing rendered.
    await router.replace(toRelativeUri(originalUri))
  } catch (e) {
    error.value = e
  }
})
</script>

// No wrapper element: a bare slot renders the consumer's vnodes (or the fallback text) directly, so
// this component adds nothing to their layout. The fallback content is the no-slot-provided case.
// This note lives out here rather than in the template block, where the SFC compiler would turn it
// into a comment vnode emitted on every render.
<template>
  <slot name="error" :error="error">{{ error }}</slot>
</template>
