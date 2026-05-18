<script setup lang="ts">
import type { EventTemplate } from '@/types/event';

defineProps<{
  templates: EventTemplate[];
}>();

const emit = defineEmits<{
  select: [templateId: string];
}>();
</script>

<template>
  <div class="template-grid">
    <button
      v-for="template in templates"
      :key="template.id"
      class="template-card"
      type="button"
      @click="emit('select', template.id)"
    >
      <span class="template-card__emoji">{{ template.emoji }}</span>
      <span class="template-card__title">{{ template.title }}</span>
      <span class="template-card__text">{{ template.description }}</span>
    </button>
  </div>
</template>
