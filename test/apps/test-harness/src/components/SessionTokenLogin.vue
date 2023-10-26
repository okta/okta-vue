<template>
  <div class="sessionTokenLogin" v-if="!authState || !authState.isAuthenticated">
    <br/>
    <label>
      Username:
      <input id="username" type="text" v-model="username"/>
      Password:
      <input id="password" type="password" v-model="password"/>
    </label>
    <button id="submit" @click="signIn">Login</button>
  </div>
</template>

<script lang="ts">
import { inject, ShallowRef, ref } from 'vue';
import { AuthState } from '@okta/okta-auth-js';
import { useAuth } from '@okta/okta-vue'

export default {
  props: {
    withRedirect: Boolean
  },
  setup({ withRedirect }) {
    const authState = inject<ShallowRef<AuthState>>('okta.authState')
    const $auth = useAuth()
    const username = ref('')
    const password = ref('')

    const signIn = () => {
      $auth.signInWithCredentials({
        username: username.value,
        password: password.value,
      })
      .then(async (res) => {
        if (withRedirect) {
          // Demonstrates redirect to /protected
          $auth.setOriginalUri('/protected');
          return $auth.token.getWithRedirect({sessionToken: res.sessionToken});
        } else {
          // Demostrates reactiveness of authState
          const { tokens } = await $auth.token.getWithoutPrompt({ sessionToken: res.sessionToken });
          $auth.tokenManager.setTokens(tokens);
        }
      })
      .catch(err => console.error(`Found an error: ${err}`))
    }

    return {
      username,
      password,
      signIn,
      // required if you've disabled Options API with `__VUE_OPTIONS_API__: false`
      authState,
    }
  },
}

</script>
