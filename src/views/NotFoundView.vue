<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AppButton from '@/components/AppButton.vue';
import EmptyState from '@/components/EmptyState.vue';

type TelegramDebugWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: {
        start_param?: string;
      };
      platform?: string;
      version?: string;
    };
  };
};

const route = useRoute();

const debugInfo = computed(() => {
  if (typeof window === 'undefined') {
    return null;
  }

  const telegramWindow = window as TelegramDebugWindow;
  const telegramWebApp = telegramWindow.Telegram?.WebApp;

  return {
    href: window.location.href,
    origin: window.location.origin,
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,

    routeFullPath: route.fullPath,
    routePath: route.path,
    routeName: route.name,
    routeParams: route.params,
    routeQuery: route.query,

    telegramStartParam: telegramWebApp?.initDataUnsafe?.start_param ?? null,
    telegramInitDataExists: Boolean(telegramWebApp?.initData),
    telegramPlatform: telegramWebApp?.platform ?? null,
    telegramVersion: telegramWebApp?.version ?? null,
  };
});

const copyDebugInfo = async () => {
  if (!debugInfo.value) {
    return;
  }

  await navigator.clipboard.writeText(JSON.stringify(debugInfo.value, null, 2));
};
</script>

<template>
  <main class="page page--centered">
    <EmptyState
        emoji="🧭"
        title="Страница не найдена"
        text="Такого маршрута нет, но можно быстро создать новый сбор."
    >
      <RouterLink to="/create">
        <AppButton>Создать сбор</AppButton>
      </RouterLink>
    </EmptyState>

    <section v-if="debugInfo" class="debug-card">
      <h2 class="debug-card__title">Debug URL</h2>

      <div class="debug-card__list">
        <div class="debug-card__row">
          <span>href</span>
          <code>{{ debugInfo.href }}</code>
        </div>

        <div class="debug-card__row">
          <span>pathname</span>
          <code>{{ debugInfo.pathname }}</code>
        </div>

        <div class="debug-card__row">
          <span>search</span>
          <code>{{ debugInfo.search || '—' }}</code>
        </div>

        <div class="debug-card__row">
          <span>hash</span>
          <code>{{ debugInfo.hash || '—' }}</code>
        </div>

        <div class="debug-card__row">
          <span>route.fullPath</span>
          <code>{{ debugInfo.routeFullPath }}</code>
        </div>

        <div class="debug-card__row">
          <span>route.path</span>
          <code>{{ debugInfo.routePath }}</code>
        </div>

        <div class="debug-card__row">
          <span>route.name</span>
          <code>{{ debugInfo.routeName }}</code>
        </div>

        <div class="debug-card__row">
          <span>tg start_param</span>
          <code>{{ debugInfo.telegramStartParam || '—' }}</code>
        </div>

        <div class="debug-card__row">
          <span>tg initData</span>
          <code>{{ debugInfo.telegramInitDataExists ? 'есть' : 'нет' }}</code>
        </div>

        <div class="debug-card__row">
          <span>tg platform</span>
          <code>{{ debugInfo.telegramPlatform || '—' }}</code>
        </div>
      </div>

      <AppButton type="button" @click="copyDebugInfo">
        Скопировать debug
      </AppButton>
    </section>
  </main>
</template>

<style scoped lang="scss">
.debug-card {
  width: 100%;
  margin-top: 20px;
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
}

.debug-card__title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.debug-card__list {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.debug-card__row {
  display: grid;
  gap: 4px;
}

.debug-card__row span {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
}

.debug-card__row code {
  display: block;
  max-width: 100%;
  padding: 8px;
  overflow-x: auto;
  border-radius: 10px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 12px;
  white-space: nowrap;
}
</style>