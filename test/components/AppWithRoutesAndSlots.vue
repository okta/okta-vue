<template>
  <div>
    <router-view v-slot="{ Component }">
      <component :is="Component">
        <template #error="errorProps">
          <p>Custom error: {{ errorProps.error }}</p>
        </template>
      </component>
    </router-view>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>
