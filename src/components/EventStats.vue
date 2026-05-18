<script setup lang="ts">
import { computed } from 'vue';
import type { EventData } from '@/types/event';
import { getPaidStats, getParticipantStats } from '@/utils/share';

const props = defineProps<{
  event: EventData;
}>();

const participantStats = computed(() => getParticipantStats(props.event.participants));
const paidStats = computed(() => getPaidStats(props.event.participants));
const doneItemsCount = computed(() => props.event.items.filter((item) => item.status === 'done').length);
</script>

<template>
  <div class="event-stats">
    <div class="event-stats__item">
      <strong>{{ participantStats.going }}</strong>
      <span>идут</span>
    </div>
    <div class="event-stats__item">
      <strong>{{ participantStats.maybe }}</strong>
      <span>возможно</span>
    </div>
    <div class="event-stats__item">
      <strong>{{ doneItemsCount }}/{{ event.items.length }}</strong>
      <span>готово</span>
    </div>
    <div v-if="event.money.enabled" class="event-stats__item">
      <strong>{{ paidStats.paid }}/{{ paidStats.total }}</strong>
      <span>скинулись</span>
    </div>
  </div>
</template>
