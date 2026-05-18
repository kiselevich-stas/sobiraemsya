<script setup lang="ts">
import { computed } from 'vue';
import AppCard from '@/components/AppCard.vue';
import type { EventData } from '@/types/event';
import { useClipboard } from '@/composables/useClipboard';
import { isRemoteStorageEnabled } from '@/services/events.repository';
import { createShareUrl, generateEventCard } from '@/utils/share';

const props = defineProps<{
  event: EventData;
}>();

const { copyText } = useClipboard();

const siteUrl = computed(() => {
  return createShareUrl(props.event, {
    includeSnapshot: !isRemoteStorageEnabled(),
  });
});

const telegramUrl = computed(() => {
  return createShareUrl(props.event, {
    telegram: true,
  });
});

const siteCardText = computed(() => {
  return generateEventCard(props.event, siteUrl.value);
});

const telegramCardText = computed(() => {
  return generateEventCard(props.event, telegramUrl.value);
});

const copySiteUrl = async () => {
  await copyText(siteUrl.value);
};

const copyTelegramUrl = async () => {
  await copyText(telegramUrl.value);
};

const copySiteCard = async () => {
  await copyText(siteCardText.value);
};

const copyTelegramCard = async () => {
  await copyText(telegramCardText.value);
};
</script>

<template>
  <AppCard>
    <div class="section-heading">
      <div>
        <h2>Итоговая карточка</h2>
      </div>
    </div>

    <div class="summary-link">
      <div>
        <span>Ссылка на сбор</span>
        <code>{{ siteUrl }}</code>
      </div>

      <button type="button" class="copy-button" @click="copySiteUrl">
        📋
      </button>
    </div>

    <div class="summary-link">
      <div>
        <span>Ссылка для Telegram</span>
        <code>{{ telegramUrl }}</code>
      </div>

      <button type="button" class="copy-button" @click="copyTelegramUrl">
        📋
      </button>
    </div>
  </AppCard>
</template>

<style class="scss" scoped>
.summary-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-link > div {
  min-width: 0;
}

.summary-link code {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-button {
  flex-shrink: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
}
</style>