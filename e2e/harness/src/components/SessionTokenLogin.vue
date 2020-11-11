<template>
  <div class="sessionTokenLogin">
    <br/>
    <label>
      Username:
      <input id="username" type="text" v-model="username"/>
      Password:
      <input id="password" type="password" v-model="password"/>
    </label>
    <button id="submit" v-on:click="signIn">Login</button>
  </div>
</template>

<script>
export default {
  name: 'SessionTokenLogin',
  data () {
    return { username: '', password: '' }
  },
  methods: {
    signIn () {
      this.$auth.signInWithCredentials({
        username: this.username,
        password: this.password
      })
      .then(res =>
        this.$auth.signInWithRedirect({
          originalUri: '/protected',
          sessionToken: res.sessionToken
        })
      )
      .catch(err => console.error(`Found an error: ${err}`))
    }
  }
}
</script>
