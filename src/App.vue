<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';

const { initTelegram } = useTelegramWebApp();

onMounted(() => {
  initTelegram();
});
</script>

<template>
  <RouterView />
</template>
