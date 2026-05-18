<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';

const { initTelegramApp } = useTelegramWebApp();

onMounted(() => {
  initTelegramApp();
});
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition name="page-transition" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>