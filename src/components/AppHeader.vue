<script setup lang="ts">
import { useUserProfile } from '@/composables/useUserProfile';

defineProps<{
  title: string;
  subtitle?: string;
}>();

const { avatarEmoji } = useUserProfile();
</script>

<template>
  <header class="app-header">
    <div class="app-header__top">
      <RouterLink class="app-header__brand" to="/">
        <span class="app-header__logo">🤝</span>
        <span>Собираемся?</span>
      </RouterLink>

      <nav class="app-header__nav" aria-label="Основная навигация">
        <RouterLink to="/events">События</RouterLink>
        <RouterLink class="app-header__profile-link" to="/profile" aria-label="Профиль">
          {{ avatarEmoji }}
        </RouterLink>
      </nav>
    </div>

    <div class="app-header__content">
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>
  </header>
</template>
