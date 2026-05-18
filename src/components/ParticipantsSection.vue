<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import type { CurrentUser, EventData, ParticipantStatus } from '@/types/event';
import { participantStatusLabels } from '@/utils/format';

const props = defineProps<{
  event: EventData;
  telegramUser: CurrentUser | null;
}>();

const emit = defineEmits<{
  save: [user: CurrentUser, status: ParticipantStatus];
}>();

const fallbackName = ref('');
const selectedStatus = ref<ParticipantStatus>('going');

const currentUser = computed<CurrentUser | null>(() => {
  if (props.telegramUser) {
    return props.telegramUser;
  }

  const trimmedName = fallbackName.value.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    id: `guest_${trimmedName.toLowerCase().replaceAll(' ', '_')}`,
    name: trimmedName,
  };
});

watch(
  () => props.telegramUser,
  (user) => {
    if (user) {
      fallbackName.value = user.name;
    }
  },
  { immediate: true },
);

const saveParticipant = () => {
  if (!currentUser.value) {
    return;
  }

  emit('save', currentUser.value, selectedStatus.value);
};
</script>

<template>
  <AppCard>
    <div class="section-heading">
      <div>
        <h2>Участники</h2>
        <p>Отметься сам и смотри, кто идёт.</p>
      </div>
    </div>

    <div class="participant-form">
      <label v-if="!telegramUser" class="field">
        <span>Твоё имя</span>
        <input v-model="fallbackName" type="text" placeholder="Например, Даша" />
      </label>

      <div class="segmented-control" aria-label="Статус участия">
        <button
          v-for="(label, status) in participantStatusLabels"
          :key="status"
          class="segmented-control__button"
          :class="{ 'segmented-control__button--active': selectedStatus === status }"
          type="button"
          @click="selectedStatus = status"
        >
          {{ label }}
        </button>
      </div>

      <AppButton :disabled="!currentUser" @click="saveParticipant">Отметиться</AppButton>
    </div>

    <div v-if="event.participants.length" class="participants-list">
      <div v-for="participant in event.participants" :key="participant.id" class="participant-row">
        <span>{{ participant.name }}</span>
        <b>{{ participantStatusLabels[participant.status] }}</b>
      </div>
    </div>

    <EmptyState
      v-else
      emoji="👋"
      title="Пока никто не отметился"
      text="Стань первым участником и отправь карточку в чат."
    />
  </AppCard>
</template>

