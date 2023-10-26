<template>
  <div id="test-app">
    <router-link to="/" tag="button" id='home-button'> Home </router-link>
    <button v-if='authState && authState.isAuthenticated' v-on:click='logout' id='logout-button'> Logout </button>
    <button v-else v-on:click='login' id='login-button'> Login </button>
    <router-link v-if='!authState || !authState.isAuthenticated' to="/sessionToken" tag="button" id='session-login-button'> Session login </router-link>
    <router-link id="protected-link" to="/protected" tag="button"> Protected </router-link>
    <router-view v-slot="{ Component }">
      <component :is="Component">
        <template #error="errorProps">
          <p v-if='errorProps.error'>Custom error: {{ errorProps.error }}</p>
        </template>
      </component>
    </router-view>
  </div>
</template>


<script lang="ts">
import { useAuth } from '@okta/okta-vue';
import { ShallowRef, inject } from 'vue';
import { AuthState } from '@okta/okta-auth-js';

export default {
  setup() {
    const authState = inject<ShallowRef<AuthState>>('okta.authState')
    const $auth = useAuth()

    const login = () => {
      $auth.signInWithRedirect()
    };

    const logout = async () => {
      $auth.signOut();
    };

    return {
      logout,
      login,
      // required if you've disabled Options API with `__VUE_OPTIONS_API__: false`
      authState,
    }
  }
}
</script>

