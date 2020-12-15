<template>
  <div class="protected">
    {{ message }}
    <pre class="userinfo">{{ user }}</pre>
  </div>
</template>

<script lang="ts">
import { NavigationGuardMixin } from '@okta/okta-vue'

export default NavigationGuardMixin.extend({
  name: 'Protected',
  data () {
    return {
      message: 'Protected!',
      user: ''
    }
  },
  created () {
    this.getUser()
  },
  methods: {
    async getUser () {
      const user = await this.$auth.getUser()
      this.user = JSON.stringify(user, null, 4)
    }
  }
})
</script>
