<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import AppHeader from '@/components/AppHeader.vue';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';
import { findTemplateById } from '@/data/templates';
import { publishTelegramEventCard } from '@/services/telegram.repository';
import { useEventsStore } from '@/stores/events.store';
import type { CreateEventPayload, Currency, MoneyMode } from '@/types/event';
import {
  currencyOptions,
  formatDateTimeLocalInputMsk,
  normalizeDateTimeLocalToMskIso,
} from '@/utils/format';

const router = useRouter();
const route = useRoute();
const eventsStore = useEventsStore();

const {
  currentUser,
  showBackButton,
} = useTelegramWebApp();

const cleanupBackButton = ref<(() => void) | null>(null);

const editingEventId = computed(() => {
  const eventId = route.params.id;

  return typeof eventId === 'string' ? eventId : null;
});

const isEditMode = computed(() => Boolean(editingEventId.value));

const editingEvent = computed(() => {
  if (!editingEventId.value) {
    return null;
  }

  return eventsStore.getEventById(editingEventId.value);
});

const templateId = computed(() => {
  if (editingEvent.value?.templateId) {
    return editingEvent.value.templateId;
  }

  return String(route.query.template || 'other');
});

const selectedTemplate = computed(() => findTemplateById(templateId.value));

const telegramSessionId = computed(() => {
  const sessionId = route.query.sessionId;

  if (typeof sessionId !== 'string') {
    return null;
  }

  if (!sessionId.startsWith('session_')) {
    return null;
  }

  return sessionId;
});

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
const isLoadingEvent = ref(false);
const pageError = ref<string | null>(null);
const telegramPublishError = ref<string | null>(null);

const canSubmit = computed(() => title.value.trim().length > 1);

const canEditEvent = computed(() => {
  if (!isEditMode.value || !editingEventId.value) {
    return true;
  }

  return eventsStore.isEventCreator(editingEventId.value, currentUser.value);
});

const headerTitle = computed(() => {
  return isEditMode.value ? 'Редактирование сбора' : 'Новый сбор';
});

const headerSubtitle = computed(() => {
  return isEditMode.value
      ? 'Изменить карточку может только создатель'
      : 'Настрой событие за пару минут';
});

const submitButtonText = computed(() => {
  if (isSubmitting.value) {
    return isEditMode.value ? 'Сохраняем...' : 'Создаём...';
  }

  return isEditMode.value ? 'Сохранить изменения' : 'Создать сбор';
});

watch(
    selectedTemplate,
    (template) => {
      if (isEditMode.value) {
        return;
      }

      if (!title.value.trim() && template.id !== 'other') {
        title.value = template.title;
      }

      items.value = [...template.items];
    },
    {
      immediate: true,
    },
);

const fillFormFromEvent = () => {
  const event = editingEvent.value;

  if (!event) {
    return;
  }

  title.value = event.title;
  startsAt.value = formatDateTimeLocalInputMsk(event.startsAt);
  place.value = event.place ?? '';
  description.value = event.description ?? '';

  isMoneyEnabled.value = event.money.enabled;
  moneyMode.value = event.money.mode;
  moneyAmount.value = event.money.amount;
  currency.value = event.money.currency;

  items.value = event.items.map((item) => item.title);
};

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

const buildPayload = (): CreateEventPayload => {
  return {
    title: title.value,
    templateId: selectedTemplate.value.id,
    startsAt: normalizeDateTimeLocalToMskIso(startsAt.value),
    place: place.value,
    description: description.value,
    money: {
      enabled: isMoneyEnabled.value,
      mode: moneyMode.value,
      amount: moneyAmount.value,
      currency: currency.value,
    },
    items: items.value,
  };
};

const submitEvent = async () => {
  if (!canSubmit.value || isSubmitting.value) {
    return;
  }

  pageError.value = null;
  telegramPublishError.value = null;
  isSubmitting.value = true;

  try {
    if (isEditMode.value && editingEventId.value) {
      const result = await eventsStore.updateEvent(
          editingEventId.value,
          buildPayload(),
          currentUser.value,
      );

      if (result.error) {
        pageError.value = result.error;
        return;
      }

      router.push(`/event/${editingEventId.value}`);
      return;
    }

    const event = await eventsStore.createEvent(buildPayload(), currentUser.value);

    if (telegramSessionId.value) {
      const publishResult = await publishTelegramEventCard({
        eventId: event.id,
        sessionId: telegramSessionId.value,
      });

      if (publishResult.error) {
        telegramPublishError.value = publishResult.error;

        window.alert(
            `Сбор создан, но карточку в Telegram-чат отправить не удалось: ${publishResult.error}`,
        );
      }
    }

    router.push(`/event/${event.id}`);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  cleanupBackButton.value = showBackButton(() => router.back());

  if (!editingEventId.value) {
    return;
  }

  isLoadingEvent.value = true;

  await eventsStore.loadEvent(editingEventId.value);

  isLoadingEvent.value = false;

  if (!editingEvent.value) {
    pageError.value = 'Событие не найдено.';
    return;
  }

  if (!canEditEvent.value) {
    pageError.value = 'Редактировать событие может только создатель карточки.';
    return;
  }

  fillFormFromEvent();
});

onBeforeUnmount(() => {
  cleanupBackButton.value?.();
});
</script>

<template>
  <main class="page create-event-page">
    <AppHeader :title="headerTitle" :subtitle="headerSubtitle" />



    <form class="create-form" @submit.prevent="submitEvent">
      <AppCard v-if="telegramSessionId && !isEditMode" class="telegram-session-card">
        <div class="telegram-session-card__content">
          <div class="telegram-session-card__icon">💬</div>

          <div>
            <h2>Сбор будет опубликован в Telegram-чате</h2>

            <p>
              После создания бот отправит живую карточку в тот чат, где написали команду /new.
            </p>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="telegramPublishError" class="telegram-publish-error">
        <strong>Карточка не отправилась в Telegram</strong>
        <p>{{ telegramPublishError }}</p>
      </AppCard>

      <AppCard v-if="pageError" class="telegram-publish-error">
        <strong>Не получилось продолжить</strong>
        <p>{{ pageError }}</p>
      </AppCard>

      <template v-if="!pageError">
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

            <input
                v-model="title"
                type="text"
                placeholder="Например, Шашлыки в субботу"
                required
            />
          </label>

          <label class="field">
            <span>Дата и время</span>
            <input v-model="startsAt" type="datetime-local" />
            <small>В карточке время будет показано по МСК.</small>
          </label>

          <label class="field">
            <span>Место</span>
            <input v-model="place" type="text" placeholder="Парк, квартира, антикафе" />
          </label>

          <label class="field">
            <span>Описание</span>

            <textarea
                v-model="description"
                placeholder="Что важно знать участникам?"
                rows="3"
            />
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
                  <option
                      v-for="currencyItem in currencyOptions"
                      :key="currencyItem"
                      :value="currencyItem"
                  >
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
            <input
                v-model="itemInput"
                type="text"
                placeholder="Например, напитки"
                @keydown.enter.prevent="addItem"
            />

            <AppButton type="button" variant="secondary" @click="addItem">
              Добавить
            </AppButton>
          </div>

          <div class="chips-list">
            <button
                v-for="(item, index) in items"
                :key="`${item}-${index}`"
                class="chip"
                type="button"
                @click="removeItem(index)"
            >
              {{ item }} <span>×</span>
            </button>
          </div>
        </AppCard>

        <div class="sticky-actions">
          <AppButton type="submit" :disabled="!canSubmit || isSubmitting">
            {{ submitButtonText }}
          </AppButton>
        </div>
      </template>
    </form>
  </main>
</template>

<style scoped lang="scss">
.create-event-page {
  overflow-x: hidden;
}

.telegram-session-card {
  border: 1px solid rgba(135, 116, 225, 0.22);
  background:
      radial-gradient(circle at top left, rgba(135, 116, 225, 0.16), transparent 34%),
      linear-gradient(135deg, #f4f1ff 0%, #ffffff 72%);
}

.telegram-session-card__content {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.telegram-session-card__icon {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  background: rgba(135, 116, 225, 0.14);
  font-size: 22px;
}

.telegram-session-card h2,
.telegram-session-card p {
  margin: 0;
  overflow-wrap: anywhere;
}

.telegram-publish-error {
  border: 1px solid rgba(239, 68, 68, 0.24);
  background: #fff1f2;
  color: #991b1b;
}

.telegram-publish-error p {
  margin-bottom: 0;
}

.field small {
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
}

.create-form,
.template-preview,
.money-settings,
.chips-list,
.add-item-row {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.add-item-row {
  display: flex;
  gap: 8px;
}

.add-item-row input {
  min-width: 0;
}

@media (max-width: 420px) {
  .telegram-session-card__content,
  .add-item-row,
  .form-grid--two {
    flex-direction: column;
    grid-template-columns: 1fr;
  }

  .add-item-row :deep(button) {
    width: 100%;
  }

  .sticky-actions {
    padding-inline: 0;
  }

  .sticky-actions :deep(button) {
    width: 100%;
  }
}
</style>