<template>
  <div class="protected">
    <div id="userinfo-container">
      {{ message }}
      <pre class="userinfo">{{ user }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
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
