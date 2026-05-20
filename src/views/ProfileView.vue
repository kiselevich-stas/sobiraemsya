<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import AppCard from '@/components/AppCard.vue';
import AppHeader from '@/components/AppHeader.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { useTelegramWebApp } from '@/composables/useTelegramWebApp';
import { useUserProfile } from '@/composables/useUserProfile';

const { currentUser } = useTelegramWebApp();

const {
  avatarOptions,
  hydrateProfileFromRemote,
  isProfileSyncing,
  profile,
  profileSyncError,
  saveProfile,
} = useUserProfile();

const form = reactive({
  displayName: profile.value.displayName,
  avatarEmoji: profile.value.avatarEmoji,
});

const successMessage = ref('');

watch(
    profile,
    (nextProfile) => {
      form.displayName = nextProfile.displayName;
      form.avatarEmoji = nextProfile.avatarEmoji;
    },
    {
      immediate: true,
      deep: true,
    },
);

watch(
    currentUser,
    (user) => {
      void hydrateProfileFromRemote(user);
    },
    {
      immediate: true,
    },
);

const submitProfile = async () => {
  successMessage.value = '';

  const result = await saveProfile(
      {
        displayName: form.displayName,
        avatarEmoji: form.avatarEmoji,
      },
      currentUser.value,
  );

  if (!result.error) {
    successMessage.value = 'Профиль сохранён';
  }
};
</script>

<template>
  <main class="page">
    <AppHeader title="Профиль" subtitle="Настрой имя и аватар для сборов" />

    <AppCard>
      <form class="profile-form" @submit.prevent="submitProfile">
        <label class="field">
          <span>Имя</span>

          <input
              v-model="form.displayName"
              type="text"
              placeholder="Например, Даша"
          />
        </label>

        <div class="field">
          <span>Аватар</span>

          <div class="avatar-grid">
            <button
                v-for="option in avatarOptions"
                :key="option.emoji"
                class="avatar-grid__item"
                :class="{
                'avatar-grid__item--active': form.avatarEmoji === option.emoji,
              }"
                type="button"
                @click="form.avatarEmoji = option.emoji"
            >
              <UserAvatar :avatar-emoji="option.emoji" :size="78" />

              <span class="avatar-grid__title">
                {{ option.title }}
              </span>
            </button>
          </div>
        </div>

        <AppButton type="submit" :disabled="isProfileSyncing">
          {{ isProfileSyncing ? 'Сохраняем...' : 'Сохранить профиль' }}
        </AppButton>

        <p v-if="successMessage" class="form-message form-message--success">
          {{ successMessage }}
        </p>

        <p v-if="profileSyncError" class="form-message form-message--error">
          {{ profileSyncError }}
        </p>
      </form>
    </AppCard>
  </main>
</template>

<style scoped lang="scss">
.profile-form {
  display: grid;
  gap: 18px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.avatar-grid__item {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 10px;
  min-height: 132px;
  padding: 16px 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 22px;
  background: #fff;
  cursor: pointer;
  transition:
      border-color 0.2s ease,
      background 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
}

.avatar-grid__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.avatar-grid__item--active {
  border-color: #8774e1;
  background: rgba(135, 116, 225, 0.12);
  box-shadow: 0 12px 28px rgba(135, 116, 225, 0.16);
}

.avatar-grid__title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.form-message {
  margin: 0;
  font-size: 14px;
}

.form-message--success {
  color: #15803d;
}

.form-message--error {
  color: #b91c1c;
}
</style>