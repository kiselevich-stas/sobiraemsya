<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppButton from '@/components/AppButton.vue';
import AppHeader from '@/components/AppHeader.vue';
import TemplateGrid from '@/components/TemplateGrid.vue';
import { eventTemplates } from '@/data/templates';

const router = useRouter();

const openCreatePage = (templateId?: string) => {
  router.push({
    path: '/create',
    query: templateId ? { template: templateId } : undefined,
  });
};
</script>

<template>
  <main class="page page--home">
    <AppHeader
      title="Собираемся?"
      subtitle="Организуй встречу в Telegram без хаоса в чате"
    />

    <section class="hero-card">
      <div class="hero-card__content">
        <span class="hero-card__eyebrow">Mini App для групповых чатов</span>
        <h2>Кто идёт, кто что берёт и кто уже скинулся — всё в одной карточке.</h2>
        <p>Создай сбор, отметь задачи и отправь итог в Telegram-чат.</p>
      </div>
      <AppButton @click="openCreatePage()">Создать сбор</AppButton>
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
