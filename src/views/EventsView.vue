<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';
import { useEventsStore } from '@/stores/events.store';
import { formatMskDateTime } from '@/utils/format';
import AppCard from "@/components/AppCard.vue";

const router = useRouter();
const eventsStore = useEventsStore();
const { currentUser } = useTelegramWebApp();

const myEvents = computed(() => eventsStore.getEventsByCreator(currentUser.value));
const latestEvents = computed(() => eventsStore.latestEvents);

const openEvent = (eventId: string) => {
  router.push(`/event/${eventId}`);
};

watch(
    currentUser,
    (user) => {
      if (!user) {
        return;
      }

      void eventsStore.loadMyEvents(user);
    },
    {
      immediate: true,
    },
);

onMounted(() => {
  eventsStore.hydrate();
  void eventsStore.loadLatestEvents();
});
</script>

<template>
  <main class="page">
    <AppHeader title="События" subtitle="Твои сборы и несколько последних карточек из приложения" />

   <AppCard v-if="myEvents.length">
     <section class="events-list">
       <div class="section-heading">
         <div>
           <h2>Мои события</h2>
           <p>Все сборы, которые созданы с твоего аккаунта.</p>
         </div>
       </div>

       <div class="events-list__grid">
         <button
             v-for="event in myEvents"
             :key="event.id"
             type="button"
             class="events-list__card"
             @click="openEvent(event.id)"
         >
           <span class="events-list__title">{{ event.title }}</span>
           <span v-if="event.startsAt" class="events-list__meta">🕒 {{ formatMskDateTime(event.startsAt) }}</span>
           <span v-if="event.place" class="events-list__meta">📍 {{ event.place }}</span>
         </button>
       </div>
     </section>
   </AppCard>

    <EmptyState
        v-if="!myEvents.length"
        emoji="🗂️"
        title="Пока нет событий"
        text="Создай первый сбор, и он появится здесь."
    />
  </main>
</template>

<style scoped lang="scss">
.events-list {
  width: 100%;
  max-width: 100%;
}

.events-list__grid {
  display: grid;
  gap: 10px;
}

.events-list__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background: #ffffff;
  color: inherit;
  text-align: left;
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
}

.events-list__title {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.events-list__meta {
  color: #64748b;
  font-size: 13px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
</style>
