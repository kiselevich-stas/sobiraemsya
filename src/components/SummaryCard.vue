<script setup lang="ts">
import { computed, ref } from 'vue';
import AppCard from '@/components/AppCard.vue';
import type { EventData } from '@/types/event';
import { useClipboard } from '@/composables/useClipboard';
import { isRemoteStorageEnabled } from '@/services/events.repository';
import { createShareUrl, generateEventCard } from '@/utils/share';

const props = defineProps<{
  event: EventData;
}>();

const { copyText } = useClipboard();

const siteUrlCopied = ref(false);
const telegramUrlCopied = ref(false);

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

const setCopied = (copiedRef: typeof siteUrlCopied) => {
  copiedRef.value = true;

  window.setTimeout(() => {
    copiedRef.value = false;
  }, 1500);
};

const copySiteUrl = async () => {
  await copyText(siteUrl.value);
  setCopied(siteUrlCopied);
};

const copyTelegramUrl = async () => {
  await copyText(telegramUrl.value);
  setCopied(telegramUrlCopied);
};
</script>

<template>
  <AppCard>
    <div class="section-heading">
      <div>
        <h2>Итоговая карточка</h2>
      </div>
    </div>

    <div class="summary-links">
      <div class="summary-link">
        <div class="summary-link__content">
          <span>Ссылка на сбор</span>
          <code>{{ siteUrl }}</code>
        </div>

        <button
            type="button"
            class="copy-button"
            :class="{ 'copy-button--copied': siteUrlCopied }"
            @click="copySiteUrl"
        >
          <span class="copy-button__icon">
            {{ siteUrlCopied ? '✓' : '📋' }}
          </span>
        </button>
      </div>

      <div class="summary-link">
        <div class="summary-link__content">
          <span>Ссылка для Telegram</span>
          <code>{{ telegramUrl }}</code>
        </div>

        <button
            type="button"
            class="copy-button"
            :class="{ 'copy-button--copied': telegramUrlCopied }"
            @click="copyTelegramUrl"
        >
          <span class="copy-button__icon">
            {{ telegramUrlCopied ? '✓' : '📋' }}
          </span>
        </button>
      </div>
    </div>
  </AppCard>
</template>

<style lang="scss" scoped>
.summary-links {
  display: grid;
  gap: 12px;
}

.summary-link {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background:
      linear-gradient(135deg, rgba(99, 102, 241, 0.08), transparent 45%),
      #ffffff;
  transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
}
.summary-link__content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.summary-link span {
  display: block;
  margin-bottom: 4px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.summary-link code {
  display: block;
  overflow: hidden;
  color: #0f172a;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.copy-button {
  position: relative;
  z-index: 1;
  display: grid;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  place-items: center;
  border: none;
  border-radius: 14px;
  background: #f1f5f9;
  cursor: pointer;
  font-size: 20px;
  transition:
      transform 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;
}

.copy-button:hover {
  transform: scale(1.06);
  background: #e0e7ff;
}

.copy-button:active {
  transform: scale(0.94);
}

.copy-button--copied {
  background: #dcfce7;
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.22);
}

.copy-button__icon {
  animation: icon-pop 0.28s ease;
}

.copy-button--copied .copy-button__icon {
  color: #16a34a;
}

@keyframes icon-pop {
  0% {
    transform: scale(0.5) rotate(-12deg);
    opacity: 0;
  }

  70% {
    transform: scale(1.18) rotate(6deg);
    opacity: 1;
  }

  100% {
    transform: scale(1) rotate(0);
  }
}
</style>