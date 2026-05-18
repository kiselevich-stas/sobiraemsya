<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import type { CurrentUser, EventData, ItemStatus } from '@/types/event';
import { itemStatusLabels } from '@/utils/format';

defineProps<{
  event: EventData;
  currentUser: CurrentUser | null;
}>();

const emit = defineEmits<{
  assign: [itemId: string];
  changeStatus: [itemId: string, status: ItemStatus];
}>();
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
            <span v-if="item.assigneeName"> · {{ item.assigneeName }}</span>
          </p>
        </div>

        <div class="item-card__actions">
          <AppButton v-if="item.status === 'free'" variant="secondary" :disabled="!currentUser" @click="emit('assign', item.id)">
            Взять
          </AppButton>
          <AppButton v-if="item.status === 'taken'" variant="secondary" @click="emit('changeStatus', item.id, 'done')">
            Готово
          </AppButton>
          <AppButton v-if="item.status !== 'free'" variant="ghost" @click="emit('changeStatus', item.id, 'free')">
            Освободить
          </AppButton>
        </div>
      </article>
    </div>

    <EmptyState v-else emoji="📝" title="Список пуст" text="Добавь задачи при создании сбора." />
  </AppCard>
</template>
