<template>
  <div>
    <div v-if='authState.isPending' id="state">pending</div>
    <div v-else-if='authState.isAuthenticated' id="state">authenticated</div>
    <div v-else id="state">not authenticated</div>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>
