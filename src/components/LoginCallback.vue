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
import { h, ref, onBeforeMount, Slot } from 'vue'
import { useAuth } from '../okta-vue'

export default {
  setup(_props: {}, { slots }: { slots: { error?: Slot } }) {
    const error = ref<string | null>(null);
    const $auth = useAuth();
    onBeforeMount(async () => {
      try {
        await $auth.handleLoginRedirect();
      } catch (e) {
        const isInteractionRequiredError = $auth.isInteractionRequiredError || $auth.idx.isInteractionRequiredError;
        if (isInteractionRequiredError(e)) {
          const { onAuthResume, onAuthRequired } = $auth.options;
          const callbackFn = onAuthResume || onAuthRequired;
          if (callbackFn) {
            callbackFn($auth);
            return;
          }
        }
        error.value = e.toString();
      }
    });
    return () => {
      if (slots.error) {
        return h('div', slots.error({ error: error.value }));
      }
      return error.value;
    }
  }
}
</script>
