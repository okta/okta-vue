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

<script>
import { toRelativeUrl } from '@okta/okta-auth-js'

export default {
  name: 'ImplicitCallback',
  async beforeMount () {
    // Handle redirect after authState is updated 
    this.$auth.authStateManager.subscribe(this.handleRedirect)
    // Store tokens when redirect back from OKTA
    await this.$auth.storeTokensFromRedirect()
  },
  methods: {
    handleRedirect ({ isPending }) {
      if (isPending) {
        return
      }

      // Unsubscribe listener
      this.$auth.authStateManager.unsubscribe(this.handleRedirect)

      // Get and clear fromUri from storage
      const fromUri = this.$auth.getFromUri()
      this.$auth.removeFromUri()

      // Redirect to fromUri
      const onPostLoginRedirect = this.$auth.options.onPostLoginRedirect
      if (onPostLoginRedirect) {
        onPostLoginRedirect(fromUri, this.$router)
      } else {
        this.$router.replace({ 
          path: toRelativeUrl(fromUri, window.location.origin) 
        })
      }
    }
  },
  render () {}
}
</script>
