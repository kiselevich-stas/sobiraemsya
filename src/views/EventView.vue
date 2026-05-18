<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/AppButton.vue';
import AppHeader from '@/components/AppHeader.vue';
import DonationBlock from '@/components/DonationBlock.vue';
import EmptyState from '@/components/EmptyState.vue';
import EventStats from '@/components/EventStats.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import ItemsSection from '@/components/ItemsSection.vue';
import MoneySection from '@/components/MoneySection.vue';
import ParticipantsSection from '@/components/ParticipantsSection.vue';
import SummaryCard from '@/components/SummaryCard.vue';
import SyncStatusBanner from '@/components/SyncStatusBanner.vue';
import { useEventRealtime } from '@/composables/useEventRealtime';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';
import { useEventsStore } from '@/stores/events.store';
import type { CurrentUser, ItemStatus, ParticipantStatus } from '@/types/event';
import { formatDateTime } from '@/utils/format';
import { decodeEventSnapshot } from '@/utils/share';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();
const { currentUser: telegramUser, isTelegram, showBackButton } = useTelegramWebApp();
const cleanupBackButton = ref<(() => void) | null>(null);
const isLoadingEvent = ref(true);

const eventId = computed(() => String(route.params.id));
const event = computed(() => eventsStore.getEventById(eventId.value));
const activeUser = ref<CurrentUser | null>(null);

const { isRealtimeConnected, realtimeError, subscribe } = useEventRealtime(eventId, (remoteEvent) => {
  eventsStore.importEvent(remoteEvent);
});

const syncActiveUser = (user: CurrentUser | null) => {
  activeUser.value = user;
};

const saveParticipant = (user: CurrentUser, status: ParticipantStatus) => {
  syncActiveUser(user);
  eventsStore.upsertParticipant(eventId.value, user, status);
};

const assignItem = (itemId: string) => {
  if (!activeUser.value && telegramUser.value) {
    activeUser.value = telegramUser.value;
  }

  if (!activeUser.value) {
    return;
  }

  eventsStore.assignItem(eventId.value, itemId, activeUser.value);
};

const changeItemStatus = (itemId: string, status: ItemStatus) => {
  eventsStore.setItemStatus(eventId.value, itemId, status);
};

const togglePaid = (participantId: string) => {
  eventsStore.toggleParticipantPayment(eventId.value, participantId);
};

const createOwnEvent = () => {
  router.push('/create');
};

const loadEvent = async () => {
  isLoadingEvent.value = true;
  await eventsStore.loadEvent(eventId.value);

  const snapshot = typeof route.query.data === 'string' ? route.query.data : '';
  if (!event.value && snapshot) {
    const decodedEvent = decodeEventSnapshot(snapshot);
    if (decodedEvent) {
      eventsStore.importEvent(decodedEvent, { persistRemote: eventsStore.isRemoteEnabled });
    }
  }

  isLoadingEvent.value = false;
};

onMounted(async () => {
  await loadEvent();

  if (telegramUser.value) {
    activeUser.value = telegramUser.value;
  }

  subscribe();
  cleanupBackButton.value = showBackButton(() => router.push('/'));
});

onBeforeUnmount(() => {
  cleanupBackButton.value?.();
});
</script>

<template>
  <main class="page">
    <template v-if="isLoadingEvent">
      <AppHeader title="Загружаем сбор" subtitle="Проверяем localStorage и Supabase" />
      <EmptyState emoji="⏳" title="Пару секунд" text="Получаем актуальные данные события." />
    </template>

    <template v-else-if="event">
      <AppHeader :title="event.title" subtitle="Карточка сбора для Telegram-чата" />

      <SyncStatusBanner
        :is-syncing="eventsStore.isSyncing"
        :sync-error="eventsStore.syncError || realtimeError"
        :last-synced-at="eventsStore.lastSyncedAt"
        :is-realtime-connected="isRealtimeConnected"
      />

      <InfoBanner
        v-if="!isTelegram"
        title="Открыто вне Telegram"
        text="Всё работает и в браузере. В Telegram Mini App дополнительно подтянется имя пользователя и системные кнопки."
      />

      <section class="event-hero">
        <div>
          <h2>{{ event.title }}</h2>
          <p v-if="event.description">{{ event.description }}</p>
          <div class="event-meta">
            <span v-if="event.startsAt">🕒 {{ formatDateTime(event.startsAt) }}</span>
            <span v-if="event.place">📍 {{ event.place }}</span>
          </div>
        </div>
      </section>

      <EventStats :event="event" />

      <ParticipantsSection :event="event" :telegram-user="telegramUser" @save="saveParticipant" />
      <ItemsSection :event="event" :current-user="activeUser || telegramUser" @assign="assignItem" @change-status="changeItemStatus" />
      <MoneySection :event="event" @toggle-paid="togglePaid" />
      <SummaryCard :event="event" />
      <DonationBlock />
    </template>

    <EmptyState
      v-else
      emoji="🔎"
      title="Сбор не найден"
      text="Событие не найдено ни в localStorage, ни в Supabase. Проверь ссылку или создай новый сбор."
    >
      <AppButton @click="createOwnEvent">Создать свой сбор</AppButton>
    </EmptyState>
  </main>
</template>
