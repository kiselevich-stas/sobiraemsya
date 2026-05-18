<script setup lang="ts">
defineProps<{
  emoji: string;
  title: string;
  text: string;
}>();
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__emoji">{{ emoji }}</div>
    <h3>{{ title }}</h3>
    <p>{{ text }}</p>
    <slot />
  </div>
</template>
