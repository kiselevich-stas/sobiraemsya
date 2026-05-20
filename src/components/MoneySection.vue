<script setup lang="ts">
import { computed } from 'vue';
import AppCard from '@/components/AppCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import type { EventData } from '@/types/event';
import { getMoneyProgress, getPaidStats } from '@/utils/share';

const props = defineProps<{
  event: EventData;
}>();

const emit = defineEmits<{
  togglePaid: [participantId: string];
  setPaidAmount: [participantId: string, amount: number];
}>();

const paidStats = computed(() => getPaidStats(props.event.participants));
const moneyProgress = computed(() => getMoneyProgress(props.event));
const goingParticipants = computed(() => props.event.participants.filter((participant) => participant.status === 'going'));
const isTotalMode = computed(() => props.event.money.mode === 'total');

const moneyLabel = computed(() => {
  if (!props.event.money.amount) {
    return 'Сумма не указана';
  }

  const modeLabel = props.event.money.mode === 'per_person' ? 'с человека' : 'общий сбор';
  return `${props.event.money.amount} ${props.event.money.currency} · ${modeLabel}`;
});

const updatePaidAmount = (participantId: string, value: string) => {
  emit('setPaidAmount', participantId, Number(value) || 0);
};
</script>

<template>
  <AppCard v-if="event.money.enabled">
    <div class="section-heading">
      <div>
        <h2>Сбор денег</h2>
        <p>{{ moneyLabel }}</p>
      </div>
      <span class="section-badge">
        <template v-if="isTotalMode">
          {{ moneyProgress.collectedAmount }} / {{ moneyProgress.targetAmount }} {{ event.money.currency }}
        </template>
        <template v-else>
          {{ paidStats.paid }} из {{ paidStats.total }}
        </template>
      </span>
    </div>

    <div v-if="isTotalMode && event.money.amount" class="money-progress" aria-label="Прогресс сбора">
      <div class="money-progress__bar">
        <span :style="{ width: `${moneyProgress.progressPercent}%` }" />
      </div>
      <p>{{ moneyProgress.progressPercent }}% собрано</p>
    </div>

    <InfoBanner
        title="Без платежей внутри приложения"
        text="Приложение не обрабатывает платежи, а только помогает отмечать, кто и сколько перевёл."
    />

    <div v-if="goingParticipants.length" class="money-list">
      <div v-for="participant in goingParticipants" :key="participant.id" class="money-row">
        <span>{{ participant.name }}</span>

        <label v-if="isTotalMode" class="money-row__amount">
          <input
              type="number"
              min="0"
              inputmode="numeric"
              :value="participant.paidAmount ?? 0"
              @input="updatePaidAmount(participant.id, ($event.target as HTMLInputElement).value)"
          />
          <span>{{ event.money.currency }}</span>
        </label>

        <input v-else type="checkbox" :checked="participant.hasPaid" @change="emit('togglePaid', participant.id)" />
      </div>
    </div>

    <EmptyState v-else emoji="💸" title="Пока нет участников" text="Когда люди отметятся как «Иду», они появятся в списке сбора." />
  </AppCard>
</template>
