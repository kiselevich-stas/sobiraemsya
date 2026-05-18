<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <header class="app-header">
    <RouterLink class="app-header__brand" to="/">
      <span class="app-header__logo">🤝</span>
      <span>Собираемся?</span>
    </RouterLink>

    <div class="app-header__content">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
  </header>
</template>
