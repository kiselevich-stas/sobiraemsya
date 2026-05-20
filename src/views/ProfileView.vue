<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import AppHeader from '@/components/AppHeader.vue';
import { avatarEmojiOptions, useUserProfile } from '@/composables/useUserProfile';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';

const { profile, saveProfile } = useUserProfile();
const { telegramUser, currentUser } = useTelegramWebApp();

const displayName = ref(profile.value.displayName);
const avatarEmoji = ref(profile.value.avatarEmoji);
const isSaved = ref(false);

const isTelegramUser = computed(() => Boolean(telegramUser.value));
const previewName = computed(() => {
  if (isTelegramUser.value) {
    return currentUser.value?.name ?? 'Telegram';
  }

  return displayName.value.trim() || 'Гость';
});

const subtitle = computed(() => {
  return isTelegramUser.value
      ? 'Имя берём из Telegram, а здесь можно выбрать аватар'
      : 'Имя и эмодзи будут подставляться в карточках сборов';
});

watch(
    profile,
    (value) => {
      displayName.value = value.displayName;
      avatarEmoji.value = value.avatarEmoji;
    },
    {
      deep: true,
    },
);

const save = () => {
  saveProfile({
    displayName: isTelegramUser.value ? profile.value.displayName : displayName.value,
    avatarEmoji: avatarEmoji.value,
  });

  isSaved.value = true;
  window.setTimeout(() => {
    isSaved.value = false;
  }, 1600);
};
</script>

<template>
  <main class="page">
    <AppHeader title="Профиль" :subtitle="subtitle" />

    <AppCard>
      <div class="profile-preview">
        <span>{{ avatarEmoji }}</span>
        <div>
          <h2>{{ previewName }}</h2>
          <p v-if="isTelegramUser">Имя подтягивается из Telegram и не меняется внутри приложения.</p>
          <p v-else>Так тебя увидят в участниках, задачах и сборе денег.</p>
        </div>
      </div>

      <div class="profile-form">
        <label v-if="!isTelegramUser" class="field">
          <span>Имя</span>
          <input v-model="displayName" type="text" placeholder="Например, Даша" />
        </label>

        <div v-else class="telegram-name-note">
          <span>Имя из Telegram</span>
          <strong>{{ previewName }}</strong>
        </div>

        <div class="profile-avatars" aria-label="Выбор аватара">
          <button
              v-for="emoji in avatarEmojiOptions"
              :key="emoji"
              type="button"
              class="profile-avatars__button"
              :class="{ 'profile-avatars__button--active': avatarEmoji === emoji }"
              :aria-label="`Выбрать ${emoji}`"
              @click="avatarEmoji = emoji"
          >
            {{ emoji }}
          </button>
        </div>

        <AppButton @click="save">
          {{ isSaved ? 'Сохранено' : 'Сохранить аватар' }}
        </AppButton>
      </div>
    </AppCard>
  </main>
</template>

<style scoped lang="scss">
.profile-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;

  > span {
    display: grid;
    flex: 0 0 58px;
    width: 58px;
    height: 58px;
    place-items: center;
    border-radius: 18px;
    background: var(--primary-soft);
    font-size: 30px;
  }

  h2 {
    margin: 0;
    font-size: 22px;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  p {
    margin: 6px 0 0;
    color: var(--text-secondary);
    line-height: 1.4;
  }
}

.profile-form {
  display: grid;
  gap: 16px;
}

.telegram-name-note {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--stroke);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);

  span {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 750;
  }

  strong {
    font-size: 16px;
  }
}

.profile-avatars {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}

.profile-avatars__button {
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid var(--stroke);
  border-radius: 16px;
  background: #ffffff;
  font-size: 24px;
}

.profile-avatars__button--active {
  border-color: var(--primary);
  background: var(--primary-soft);
  box-shadow: 0 0 0 3px rgba(42, 171, 238, 0.12);
}

@media (max-width: 420px) {
  .profile-avatars {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
