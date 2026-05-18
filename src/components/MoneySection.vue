<script setup lang="ts">
import { computed } from 'vue';
import AppCard from '@/components/AppCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import type { EventData } from '@/types/event';
import { getPaidStats } from '@/utils/share';

const props = defineProps<{
  event: EventData;
}>();

const emit = defineEmits<{
  togglePaid: [participantId: string];
}>();

const paidStats = computed(() => getPaidStats(props.event.participants));
const goingParticipants = computed(() => props.event.participants.filter((participant) => participant.status === 'going'));
const moneyLabel = computed(() => {
  if (!props.event.money.amount) {
    return 'Сумма не указана';
  }

  const modeLabel = props.event.money.mode === 'per_person' ? 'с человека' : 'общий сбор';
  return `${props.event.money.amount} ${props.event.money.currency} · ${modeLabel}`;
});
</script>

<template>
  <AppCard v-if="event.money.enabled">
    <div class="section-heading">
      <div>
        <h2>Сбор денег</h2>
        <p>{{ moneyLabel }}</p>
      </div>
      <span class="section-badge">{{ paidStats.paid }} из {{ paidStats.total }}</span>
    </div>

    <InfoBanner
      title="Без платежей внутри приложения"
      text="Приложение не обрабатывает платежи, а только помогает отмечать, кто перевёл."
    />

    <div v-if="goingParticipants.length" class="money-list">
      <label v-for="participant in goingParticipants" :key="participant.id" class="money-row">
        <span>{{ participant.name }}</span>
        <input type="checkbox" :checked="participant.hasPaid" @change="emit('togglePaid', participant.id)" />
      </label>
    </div>

    <EmptyState v-else emoji="💸" title="Пока нет участников" text="Когда люди отметятся как «Иду», они появятся в списке сбора." />
  </AppCard>
</template>
