<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  defaultAvatarEmoji,
  getAvatarOptionByEmoji,
} from '@/data/avatarOptions';

const props = withDefaults(
    defineProps<{
      avatarEmoji?: string | null;
      size?: number;
    }>(),
    {
      avatarEmoji: defaultAvatarEmoji,
      size: 64,
    },
);

const isImageError = ref(false);

const selectedAvatar = computed(() => {
  return getAvatarOptionByEmoji(props.avatarEmoji);
});

const avatarStyle = computed(() => {
  return {
    width: `${props.size}px`,
    height: `${props.size}px`,
  };
});

const emojiStyle = computed(() => {
  return {
    fontSize: `${Math.round(props.size * 0.52)}px`,
  };
});

watch(
    () => props.avatarEmoji,
    () => {
      isImageError.value = false;
    },
);
</script>

<template>
  <span class="user-avatar" :style="avatarStyle">
    <picture v-if="!isImageError" class="user-avatar__picture">
      <source :srcset="selectedAvatar.webpUrl" type="image/webp" />

      <img
          class="user-avatar__image"
          :src="selectedAvatar.gifUrl"
          :alt="selectedAvatar.emoji"
          loading="lazy"
          decoding="async"
          @error="isImageError = true"
      />
    </picture>

    <span v-else class="user-avatar__emoji" :style="emojiStyle">
      {{ selectedAvatar.emoji }}
    </span>
  </span>
</template>

<style scoped lang="scss">
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 999px;
  //background:
  //    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.95), transparent 28%),
  //    linear-gradient(135deg, rgba(135, 116, 225, 0.18), rgba(255, 194, 87, 0.28));
  //box-shadow:
  //    inset 0 0 0 1px rgba(255, 255, 255, 0.7),
  //    0 10px 28px rgba(15, 23, 42, 0.1);
}

.user-avatar__picture {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  height: 90%;
  flex: 0 0 auto;
}

.user-avatar__image {
  display: block;
  width: 90%;
  height: 90%;
  object-fit: contain;
  transform-origin: center;
}

.user-avatar__emoji {
  line-height: 1;
}
</style>