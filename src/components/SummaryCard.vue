<script setup lang="ts">
import { computed } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import type { EventData } from '@/types/event';
import { useClipboard } from '@/composables/useClipboard';
import { isRemoteStorageEnabled } from '@/services/events.repository';
import { createShareUrl, generateEventCard } from '@/utils/share';

const props = defineProps<{
  event: EventData;
}>();

const { isCopied, copyText } = useClipboard();

const shareUrl = computed(() => {
  return createShareUrl(props.event, {
    includeSnapshot: !isRemoteStorageEnabled(),
  });
});
const cardText = computed(() => generateEventCard(props.event, shareUrl.value));

const copyCard = async () => {
  await copyText(cardText.value);
};

const copyLink = async () => {
  await copyText(shareUrl.value);
};

const shareCard = async () => {
  if (navigator.share) {
    await navigator.share({
      title: props.event.title,
      text: cardText.value,
      url: shareUrl.value,
    });
    return;
  }

  await copyCard();
};
</script>

<template>
  <AppCard>
    <div class="section-heading">
      <div>
        <h2>Итоговая карточка</h2>
        <p>Скопируй текст и отправь его в Telegram-чат.</p>
      </div>
    </div>

    <textarea class="summary-textarea" :value="cardText" readonly />

    <div class="summary-link">
      <span>Ссылка на сбор</span>
      <code>{{ shareUrl }}</code>
    </div>

    <div class="summary-actions">
      <AppButton @click="copyCard">{{ isCopied ? 'Скопировано' : 'Скопировать текст' }}</AppButton>
      <AppButton variant="secondary" @click="shareCard">Поделиться</AppButton>
      <AppButton variant="ghost" @click="copyLink">Скопировать ссылку</AppButton>
    </div>
  </AppCard>
</template>
