<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppButton from '@/components/AppButton.vue';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import EventStats from '@/components/EventStats.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import ItemsSection from '@/components/ItemsSection.vue';
import MoneySection from '@/components/MoneySection.vue';
import ParticipantsSection from '@/components/ParticipantsSection.vue';
import SummaryCard from '@/components/SummaryCard.vue';
import { useEventRealtime } from '@/composables/useEventRealtime';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';
import { useEventsStore } from '@/stores/events.store';
import type { CurrentUser, ItemStatus, ParticipantStatus } from '@/types/event';
import { formatMskDateTime } from '@/utils/format';
import { decodeEventSnapshot } from '@/utils/share';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();

const {
  currentUser: telegramUser,
  isTelegram,
  showBackButton,
} = useTelegramWebApp();

const cleanupBackButton = ref<(() => void) | null>(null);
const isLoadingEvent = ref(true);

const eventId = computed(() => String(route.params.id));
const event = computed(() => eventsStore.getEventById(eventId.value));

const activeUser = ref<CurrentUser | null>(null);

const { isRealtimeConnected, realtimeError, subscribe } = useEventRealtime(
    eventId,
    (remoteEvent) => {
      eventsStore.importEvent(remoteEvent);
    },
);

const isCreator = computed(() => {
  return eventsStore.isEventCreator(eventId.value, telegramUser.value);
});

const creatorLabel = computed(() => {
  if (!event.value?.creatorName && !event.value?.creatorTelegramUsername) {
    return '';
  }

  if (event.value.creatorTelegramUsername) {
    return `@${event.value.creatorTelegramUsername}`;
  }

  return event.value.creatorName ?? '';
});

const syncActiveUser = (user: CurrentUser | null) => {
  activeUser.value = user;
};

watch(
    telegramUser,
    (user) => {
      syncActiveUser(user);

      if (!user || isLoadingEvent.value) {
        return;
      }

      eventsStore.syncUserProfile(eventId.value, user);
    },
    {
      immediate: true,
    },
);

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

const unassignItem = (itemId: string, userId: string) => {
  eventsStore.unassignItem(eventId.value, itemId, userId);
};

const togglePaid = (participantId: string) => {
  eventsStore.toggleParticipantPayment(eventId.value, participantId);
};

const setPaidAmount = (participantId: string, amount: number) => {
  eventsStore.setParticipantPaidAmount(eventId.value, participantId, amount);
};

const createOwnEvent = () => {
  router.push('/create');
};

const openEditPage = () => {
  router.push(`/event/${eventId.value}/edit`);
};

const loadEvent = async () => {
  isLoadingEvent.value = true;

  await eventsStore.loadEvent(eventId.value);

  const snapshot = typeof route.query.data === 'string' ? route.query.data : '';

  if (!event.value && snapshot) {
    const decodedEvent = decodeEventSnapshot(snapshot);

    if (decodedEvent) {
      eventsStore.importEvent(decodedEvent, {
        persistRemote: eventsStore.isRemoteEnabled,
      });
    }
  }

  isLoadingEvent.value = false;
};

onMounted(async () => {
  await loadEvent();

  if (telegramUser.value) {
    activeUser.value = telegramUser.value;
    eventsStore.syncUserProfile(eventId.value, telegramUser.value);
  }

  subscribe();

  cleanupBackButton.value = showBackButton(() => router.push('/'));
});

onBeforeUnmount(() => {
  cleanupBackButton.value?.();
});
</script>

<template>
  <main class="page event-page">
    <template v-if="isLoadingEvent">
      <AppHeader title="Загружаем сбор" subtitle="Проверяем localStorage и Supabase" />

      <EmptyState emoji="⏳" title="Пару секунд" text="Получаем актуальные данные события." />
    </template>

    <template v-else-if="event">
      <AppHeader :title="event.title" subtitle="Карточка сбора для Telegram-чата" />


      <InfoBanner
          v-if="!isTelegram"
          title="Открыто вне Telegram"
          text="Всё работает и в браузере. В Telegram Mini App дополнительно подтянется имя пользователя и системные кнопки."
      />

      <section class="event-hero">
        <div class="event-hero__content">
          <div>
            <h2>{{ event.title }}</h2>

            <p v-if="event.description">{{ event.description }}</p>

            <div class="event-meta">
              <span v-if="event.startsAt">🕒 {{ formatMskDateTime(event.startsAt) }}</span>
              <span v-if="event.place">📍 {{ event.place }}</span>
              <span v-if="creatorLabel">👤 {{ creatorLabel }}</span>
            </div>
          </div>

          <div v-if="isCreator" class="event-hero__actions">
            <AppButton type="button" variant="secondary" @click="openEditPage">
              Редактировать
            </AppButton>
          </div>
        </div>
      </section>

      <EventStats :event="event" />

      <ParticipantsSection
          :event="event"
          :telegram-user="telegramUser"
          @save="saveParticipant"
      />

      <ItemsSection
          :event="event"
          :current-user="activeUser || telegramUser"
          @assign="assignItem"
          @unassign="unassignItem"
          @change-status="changeItemStatus"
      />

      <MoneySection :event="event" @toggle-paid="togglePaid" @set-paid-amount="setPaidAmount" />

      <SummaryCard :event="event" />
    </template>

    <EmptyState
        v-else
        emoji="🤷"
        title="Сбор не найден"
        text="Событие не найдено ни в localStorage, ни в Supabase. Проверь ссылку или создай новый сбор."
    >
      <AppButton @click="createOwnEvent">Создать свой сбор</AppButton>
    </EmptyState>
  </main>
</template>

<style scoped lang="scss">
.event-page {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.event-hero {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.event-hero__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
}

.event-hero__content > div:first-child {
  min-width: 0;
}

.event-hero h2 {
  margin: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.event-hero p {
  word-break: break-word;
  overflow-wrap: anywhere;
}

.event-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.event-meta span {
  max-width: 100%;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.event-hero__actions {
  flex: 0 0 auto;
}

@media (max-width: 420px) {
  .event-hero__content {
    flex-direction: column;
  }

  .event-hero__actions {
    width: 100%;
  }

  .event-hero__actions :deep(button) {
    width: 100%;
  }

  .event-meta {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
