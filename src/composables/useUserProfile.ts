import { computed, ref } from 'vue';

import type { UserProfile } from '@/types/profile';
import { loadProfileFromStorage, saveProfileToStorage } from '@/utils/storage';

export const avatarEmojiOptions = [
  '😀',
  '😎',
  '🤠',
  '🥳',
  '🤡',
  '👽',
  '🤖',
  '😈',
  '👻',
  '🧙‍♂️',
  '🧛‍♀️',
  '🧟‍♂️',
  '🧞‍♂️',
  '🦸‍♀️',
  '🕺',
  '💃',
] as const;

const defaultProfile: UserProfile = {
  displayName: '',
  avatarEmoji: avatarEmojiOptions[0],
};

const isKnownAvatarEmoji = (emoji: string) => {
  return avatarEmojiOptions.includes(emoji as (typeof avatarEmojiOptions)[number]);
};

const profile = ref<UserProfile>({
  ...defaultProfile,
  ...loadProfileFromStorage(),
});

if (!isKnownAvatarEmoji(profile.value.avatarEmoji)) {
  profile.value.avatarEmoji = defaultProfile.avatarEmoji;
}

export const useUserProfile = () => {
  const saveProfile = (nextProfile: UserProfile) => {
    profile.value = {
      displayName: nextProfile.displayName.trim(),
      avatarEmoji: isKnownAvatarEmoji(nextProfile.avatarEmoji)
          ? nextProfile.avatarEmoji
          : defaultProfile.avatarEmoji,
    };

    saveProfileToStorage(profile.value);
  };

  const avatarEmoji = computed(() => profile.value.avatarEmoji || defaultProfile.avatarEmoji);

  return {
    avatarEmoji,
    avatarEmojiOptions,
    profile,
    saveProfile,
  };
};
