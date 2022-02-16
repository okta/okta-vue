<template>
  <div id="app">
    <router-link to="/" tag="button" id='home-button'> Home </router-link>
    <button v-if='authState && authState.isAuthenticated' v-on:click='logout' id='logout-button'> Logout </button>
    <button v-else v-on:click='login' id='login-button'> Login </button>
    <router-link to="/protected" tag="button"> Protected </router-link>
    <router-view v-slot="{ Component }">
      <component :is="Component">
        <template #error="errorProps">
          <p>Custom error: {{ errorProps.error }}</p>
        </template>
      </component>
    </router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'app',
  methods: {
    login () {
      this.$auth.signInWithRedirect()
    },
    async logout () {
      await this.$auth.signOut()
    }
  }
})
</script>
