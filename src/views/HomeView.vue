<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppButton from '@/components/AppButton.vue';
import AppHeader from '@/components/AppHeader.vue';
import TemplateGrid from '@/components/TemplateGrid.vue';
import { eventTemplates } from '@/data/templates';

const router = useRouter();
const route = useRoute();

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

const openCreatePage = (templateId?: string) => {
  router.push({
    path: '/create',
    query: {
      ...(templateId
          ? {
            template: templateId,
          }
          : {}),
      ...(telegramSessionId.value
          ? {
            sessionId: telegramSessionId.value,
          }
          : {}),
    },
  });
};
</script>

<template>
  <main class="page page--home">
    <AppHeader
        title="Собираемся?"
        subtitle="Организуй встречу в Telegram без хаоса в чате"
    />

    <section v-if="telegramSessionId" class="telegram-session-banner">
      <div class="telegram-session-banner__icon">💬</div>

      <div>
        <strong>Создание сбора для Telegram-чата</strong>
        <p>
          Выбери шаблон или создай сбор с нуля. После создания бот опубликует
          живую карточку в чате.
        </p>
      </div>
    </section>

    <section class="hero-card">
      <div class="hero-card__content">
        <span class="hero-card__eyebrow">Mini App для групповых чатов</span>
        <h2>Кто идёт, кто что берёт и кто уже скинулся — всё в одной карточке.</h2>
        <p>Создай сбор, отметь задачи и отправь итог в Telegram-чат.</p>
      </div>

      <AppButton @click="openCreatePage()">
        Создать сбор
      </AppButton>
    </section>

    <section class="page-section">
      <div class="section-heading">
        <div>
          <h2>Выбери шаблон</h2>
          <p>Мы сразу подставим список задач, чтобы не начинать с пустого листа.</p>
        </div>
      </div>

      <TemplateGrid :templates="eventTemplates" @select="openCreatePage" />
    </section>
  </main>
</template>

<style scoped lang="scss">
.telegram-session-banner {
  display: flex;
  gap: 12px;
  padding: 14px;
  margin-bottom: 16px;
  border: 1px solid rgba(135, 116, 225, 0.22);
  border-radius: 20px;
  background:
      radial-gradient(circle at top left, rgba(135, 116, 225, 0.16), transparent 34%),
      linear-gradient(135deg, #f4f1ff 0%, #ffffff 72%);
  color: #1e1b4b;
}

.telegram-session-banner__icon {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  background: rgba(135, 116, 225, 0.14);
  font-size: 22px;
}

.telegram-session-banner strong {
  display: block;
  margin-bottom: 4px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
}

.telegram-session-banner p {
  margin: 0;
  color: #4338ca;
  font-size: 13px;
  line-height: 1.45;
}
</style>