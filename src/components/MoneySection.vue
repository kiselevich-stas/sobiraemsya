<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import InfoBanner from '@/components/InfoBanner.vue';
import type { CurrentUser, EventData } from '@/types/event';
import { getMoneyProgress, getPaidStats } from '@/utils/share';

const props = defineProps<{
  event: EventData;
  currentUser: CurrentUser | null;
}>();

const emit = defineEmits<{
  togglePaid: [participantId: string];
  setPaidAmount: [participantId: string, amount: number];
}>();

const draftPaidAmount = ref('0');

const paidStats = computed(() => getPaidStats(props.event.participants));
const moneyProgress = computed(() => getMoneyProgress(props.event));
const goingParticipants = computed(() => props.event.participants.filter((participant) => participant.status === 'going'));
const sortedGoingParticipants = computed(() => {
  const currentUserId = props.currentUser?.id;

  if (!currentUserId) {
    return goingParticipants.value;
  }

  return [...goingParticipants.value].sort((firstParticipant, secondParticipant) => {
    if (firstParticipant.id === currentUserId) {
      return -1;
    }

    if (secondParticipant.id === currentUserId) {
      return 1;
    }

    return 0;
  });
});
const isTotalMode = computed(() => props.event.money.mode === 'total');
const currentParticipant = computed(() => {
  if (!props.currentUser) {
    return null;
  }

  return goingParticipants.value.find((participant) => participant.id === props.currentUser?.id) ?? null;
});

const moneyLabel = computed(() => {
  if (!props.event.money.amount) {
    return 'Сумма не указана';
  }

  const modeLabel = props.event.money.mode === 'per_person' ? 'с человека' : 'общий сбор';
  return `${props.event.money.amount} ${props.event.money.currency} · ${modeLabel}`;
});

const isCurrentParticipant = (participantId: string) => {
  return Boolean(props.currentUser && participantId === props.currentUser.id);
};

const formatPaidAmount = (amount?: number) => {
  return `${amount ?? 0} ${props.event.money.currency}`;
};

const saveOwnPaidAmount = () => {
  if (!currentParticipant.value) {
    return;
  }

  emit('setPaidAmount', currentParticipant.value.id, Number(draftPaidAmount.value) || 0);
};

watch(
    currentParticipant,
    (participant) => {
      draftPaidAmount.value = String(participant?.paidAmount ?? 0);
    },
    {
      immediate: true,
    },
);
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
      <div
          v-for="participant in sortedGoingParticipants"
          :key="participant.id"
          class="money-row"
          :class="{ 'money-row--own': isCurrentParticipant(participant.id) }"
      >
        <span>{{ participant.avatarEmoji || '🙂' }} {{ participant.name }}</span>

        <div v-if="isTotalMode" class="money-row__controls">
          <label v-if="isCurrentParticipant(participant.id)" class="money-row__amount">
            <input
                v-model="draftPaidAmount"
                type="number"
                min="0"
                inputmode="numeric"
            />
            <span>{{ event.money.currency }}</span>
          </label>
          <span v-else class="money-row__readonly">{{ formatPaidAmount(participant.paidAmount) }}</span>

          <AppButton
              v-if="isCurrentParticipant(participant.id)"
              class="money-row__done-button"
              variant="secondary"
              aria-label="Сохранить сумму"
              @click="saveOwnPaidAmount"
          >
            ✓
          </AppButton>
        </div>

        <div v-else class="money-row__controls">
          <AppButton
              v-if="isCurrentParticipant(participant.id)"
              :variant="participant.hasPaid ? 'ghost' : 'secondary'"
              @click="emit('togglePaid', participant.id)"
          >
            {{ participant.hasPaid ? 'Отменить' : 'Готово' }}
          </AppButton>
          <span v-else class="money-row__readonly">{{ participant.hasPaid ? 'Скинулся' : 'Ждём' }}</span>
        </div>
      </div>
    </div>

    <EmptyState v-else emoji="💸" title="Пока нет участников" text="Когда люди отметятся как «Иду», они появятся в списке сбора." />
  </AppCard>
</template>
