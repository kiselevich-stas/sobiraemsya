<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import AppHeader from '@/components/AppHeader.vue';
import SyncStatusBanner from '@/components/SyncStatusBanner.vue';
import { findTemplateById } from '@/data/templates';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';
import { useEventsStore } from '@/stores/events.store';
import type { Currency, MoneyMode } from '@/types/event';
import { currencyOptions } from '@/utils/format';

const router = useRouter();
const route = useRoute();
const eventsStore = useEventsStore();
const { showBackButton } = useTelegramWebApp();
const cleanupBackButton = ref<(() => void) | null>(null);

const templateId = computed(() => String(route.query.template || 'other'));
const selectedTemplate = computed(() => findTemplateById(templateId.value));

const title = ref('');
const startsAt = ref('');
const place = ref('');
const description = ref('');
const isMoneyEnabled = ref(false);
const moneyMode = ref<MoneyMode>('per_person');
const moneyAmount = ref<number | null>(null);
const currency = ref<Currency>('₽');
const itemInput = ref('');
const items = ref<string[]>([]);
const isSubmitting = ref(false);

const canSubmit = computed(() => title.value.trim().length > 1);

watch(
  selectedTemplate,
  (template) => {
    if (!title.value.trim() && template.id !== 'other') {
      title.value = template.title;
    }
    items.value = [...template.items];
  },
  { immediate: true },
);

const addItem = () => {
  const trimmedItem = itemInput.value.trim();
  if (!trimmedItem) {
    return;
  }

  items.value.push(trimmedItem);
  itemInput.value = '';
};

const removeItem = (itemIndex: number) => {
  items.value.splice(itemIndex, 1);
};

const createEvent = async () => {
  if (!canSubmit.value || isSubmitting.value) {
    return;
  }

  isSubmitting.value = true;

  try {
    const event = await eventsStore.createEvent({
      title: title.value,
      templateId: selectedTemplate.value.id,
      startsAt: startsAt.value,
      place: place.value,
      description: description.value,
      money: {
        enabled: isMoneyEnabled.value,
        mode: moneyMode.value,
        amount: moneyAmount.value,
        currency: currency.value,
      },
      items: items.value,
    });

    router.push(`/event/${event.id}`);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  cleanupBackButton.value = showBackButton(() => router.back());
});

onBeforeUnmount(() => {
  cleanupBackButton.value?.();
});
</script>

<template>
  <main class="page">
    <AppHeader title="Новый сбор" subtitle="Настрой событие за пару минут" />

    <SyncStatusBanner
      :is-syncing="eventsStore.isSyncing"
      :sync-error="eventsStore.syncError"
      :last-synced-at="eventsStore.lastSyncedAt"
    />

    <form class="create-form" @submit.prevent="createEvent">
      <AppCard>
        <div class="template-preview">
          <span>{{ selectedTemplate.emoji }}</span>
          <div>
            <strong>{{ selectedTemplate.title }}</strong>
            <p>{{ selectedTemplate.description }}</p>
          </div>
        </div>

        <label class="field">
          <span>Название события</span>
          <input v-model="title" type="text" placeholder="Например, Шашлыки в субботу" required />
        </label>

        <label class="field">
          <span>Дата и время</span>
          <input v-model="startsAt" type="datetime-local" />
        </label>

        <label class="field">
          <span>Место</span>
          <input v-model="place" type="text" placeholder="Парк, квартира, антикафе" />
        </label>

        <label class="field">
          <span>Описание</span>
          <textarea v-model="description" placeholder="Что важно знать участникам?" rows="3" />
        </label>
      </AppCard>

      <AppCard>
        <div class="section-heading">
          <div>
            <h2>Сбор денег</h2>
            <p>Только учёт переводов, без обработки платежей.</p>
          </div>
          <label class="switch">
            <input v-model="isMoneyEnabled" type="checkbox" />
            <span />
          </label>
        </div>

        <div v-if="isMoneyEnabled" class="money-settings">
          <div class="segmented-control">
            <button
              type="button"
              class="segmented-control__button"
              :class="{ 'segmented-control__button--active': moneyMode === 'per_person' }"
              @click="moneyMode = 'per_person'"
            >
              С человека
            </button>
            <button
              type="button"
              class="segmented-control__button"
              :class="{ 'segmented-control__button--active': moneyMode === 'total' }"
              @click="moneyMode = 'total'"
            >
              Общая сумма
            </button>
          </div>

          <div class="form-grid form-grid--two">
            <label class="field">
              <span>Сумма</span>
              <input v-model.number="moneyAmount" type="number" min="0" placeholder="700" />
            </label>

            <label class="field">
              <span>Валюта</span>
              <select v-model="currency">
                <option v-for="currencyItem in currencyOptions" :key="currencyItem" :value="currencyItem">
                  {{ currencyItem }}
                </option>
              </select>
            </label>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="section-heading">
          <div>
            <h2>Вещи и задачи</h2>
            <p>Их потом смогут разобрать участники.</p>
          </div>
        </div>

        <div class="add-item-row">
          <input v-model="itemInput" type="text" placeholder="Например, напитки" @keydown.enter.prevent="addItem" />
          <AppButton variant="secondary" @click="addItem">Добавить</AppButton>
        </div>

        <div class="chips-list">
          <button v-for="(item, index) in items" :key="`${item}-${index}`" class="chip" type="button" @click="removeItem(index)">
            {{ item }} <span>×</span>
          </button>
        </div>
      </AppCard>

      <div class="sticky-actions">
        <AppButton type="submit" :disabled="!canSubmit || isSubmitting">{{ isSubmitting ? 'Создаём...' : 'Создать сбор' }}</AppButton>
      </div>
    </form>
  </main>
</template>
