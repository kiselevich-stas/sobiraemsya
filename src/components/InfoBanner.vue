<script setup lang="ts">
defineProps<{
  title: string;
  text: string;
}>();
</script>

<template>
  <div class="info-banner">
    <strong>{{ title }}</strong>
    <span>{{ text }}</span>
  </div>
</template>
