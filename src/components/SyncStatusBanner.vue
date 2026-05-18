<script setup lang="ts">
import { computed } from 'vue';
import AppCard from '@/components/AppCard.vue';
import { isRemoteStorageEnabled } from '@/services/events.repository';

const props = defineProps<{
  isSyncing: boolean;
  syncError: string | null;
  lastSyncedAt: string | null;
  isRealtimeConnected?: boolean;
}>();

const modeLabel = computed(() => {
  if (!isRemoteStorageEnabled()) {
    return 'Локальный режим';
  }

  if (props.isSyncing) {
    return 'Синхронизируем';
  }

  if (props.syncError) {
    return 'Есть ошибка синхронизации';
  }

  return props.isRealtimeConnected ? 'Supabase + Realtime' : 'Supabase';
});

const description = computed(() => {
  if (!isRemoteStorageEnabled()) {
    return 'Добавь ключи в .env.local — и приложение начнёт сохранять события в Supabase.';
  }

  if (props.syncError) {
    return props.syncError;
  }

  if (props.isRealtimeConnected) {
    return 'Изменения участников будут подтягиваться у всех, кто открыл ссылку.';
  }

  return 'Событие сохраняется в Supabase. Realtime можно включить в настройках проекта.';
});
</script>

<template>
  <AppCard class="sync-status" :class="{ 'sync-status--error': syncError }">
    <div>
      <span class="sync-status__label">{{ modeLabel }}</span>
      <p>{{ description }}</p>
    </div>
    <span v-if="lastSyncedAt && !syncError" class="sync-status__dot" aria-label="Синхронизировано" />
  </AppCard>
</template>
