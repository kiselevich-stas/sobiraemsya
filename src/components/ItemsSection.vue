<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import type { CurrentUser, EventData } from '@/types/event';
import { itemStatusLabels } from '@/utils/format';

const props = defineProps<{
  event: EventData;
  currentUser: CurrentUser | null;
}>();

const emit = defineEmits<{
  assign: [itemId: string];
  unassign: [itemId: string, userId: string];
}>();

const getAssigneeNames = (item: EventData['items'][number]) => {
  return item.assignees?.map((assignee) => assignee.name).join(', ') || item.assigneeName || '';
};

const isAssignedToCurrentUser = (item: EventData['items'][number]) => {
  if (!props.currentUser) {
    return false;
  }

  return Boolean(
      item.assignees?.some((assignee) => assignee.id === props.currentUser?.id) ||
      item.assigneeId === props.currentUser.id,
  );
};
</script>

<template>
  <AppCard>
    <div class="section-heading">
      <div>
        <h2>Кто что берёт</h2>
        <p>Разберите задачи, чтобы в чате не потерялось важное.</p>
      </div>
    </div>

    <div v-if="event.items.length" class="items-list">
      <article v-for="item in event.items" :key="item.id" class="item-card" :class="`item-card--${item.status}`">
        <div class="item-card__main">
          <h3>{{ item.title }}</h3>
          <p>
            {{ itemStatusLabels[item.status] }}
            <span v-if="getAssigneeNames(item)"> · {{ getAssigneeNames(item) }}</span>
          </p>
        </div>

        <div class="item-card__actions">
          <AppButton v-if="!isAssignedToCurrentUser(item)" variant="secondary" :disabled="!currentUser" @click="emit('assign', item.id)">
            Взять
          </AppButton>
          <AppButton v-else variant="ghost" @click="emit('unassign', item.id, currentUser!.id)">
            Не беру
          </AppButton>
        </div>
      </article>
    </div>

    <EmptyState v-else emoji="📝" title="Список пуст" text="Добавь задачи при создании сбора." />
  </AppCard>
</template>
