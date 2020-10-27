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
export default {
  name: 'Security',
  data() {
    return {
      authState: this.$auth.authStateManager.getAuthState()
    }
  },
  provide() {
    return {
      authState: this.authState
    }
  },
  created() {
    // Subscribe to the latest authState
    this.$auth.authStateManager.subscribe(this.handleAuthStateUpdate)
    if (!this.$auth.token.isLoginRedirect()) {
      // Trigger an initial change event to make sure authState is latest
      this.$auth.authStateManager.updateAuthState();
    }
  },
  beforeDestroy() {
    this.$auth.authStateManager.unsubscribe(this.handleAuthStateUpdate)
  },
  methods: {
    handleAuthStateUpdate: async function(authState) {
      // update provider data 
      this.authState = Object.assign(this.authState, authState)
      
      // guard protected routes
      const { isPending, isAuthenticated } = authState
      const { meta, fullPath } = this.$router.currentRoute
      if (meta.requiresAuth && !isPending && !isAuthenticated) {
        this.$auth._handleLogin(fullPath)
      }
    }
  },
  render() {
    return this.$scopedSlots.default({})
  }
}
</script>
