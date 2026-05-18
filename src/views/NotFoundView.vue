<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import EmptyState from '@/components/EmptyState.vue';
</script>

<template>
  <main class="page page--centered">
    <EmptyState emoji="🧭" title="Страница не найдена" text="Такого маршрута нет, но можно быстро создать новый сбор.">
      <RouterLink to="/create">
        <AppButton>Создать сбор</AppButton>
      </RouterLink>
    </EmptyState>
  </main>
</template>
