<template>
  <div class="protected">
    <div v-if="authState && authState.isAuthenticated">
      {{ message }}
      <br />
      <button v-if='authState && authState.isAuthenticated' v-on:click='renewToken' id='upd-button'>Renew token</button>
      <br />
      <br />
      <div>User:</div>
      <pre id="userinfo-container" class="userinfo">{{ user }}</pre>
      <br />
      <div>Access token claims:</div>
      <pre id="token-claims-container" class="tokenclaims">{{ tokenClaims }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { inject, ShallowRef, ref, onMounted } from 'vue';
import { AuthState } from '@okta/okta-auth-js';
import { useAuth } from '@okta/okta-vue';

export default {
  setup() {
    const authState = inject<ShallowRef<AuthState>>('okta.authState')
    const $auth = useAuth()
    const message = ref('Protected!')
    const user = ref('')
    const tokenClaims = ref('')

    const getUser = async () => {
      const userJson = await $auth.getUser()
      user.value = JSON.stringify(userJson, null, 4)
    }

    const updateTokenClaims = () => {
      const accessTokenClaims = $auth.tokenManager.getTokensSync().accessToken?.claims;
      tokenClaims.value = JSON.stringify(accessTokenClaims, null, 4)
    }

    const renewToken = async () => {
      await $auth.tokenManager.renew('accessToken');
    }

    onMounted(() => {
      updateTokenClaims()
      $auth.authStateManager.subscribe(updateTokenClaims)
      getUser()
    })

    return {
      message,
      user,
      tokenClaims,
      renewToken,
      // required if you've disabled Options API with `__VUE_OPTIONS_API__: false`
      authState,
    }
  }
}
</script>
