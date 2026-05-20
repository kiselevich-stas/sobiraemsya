import { computed, ref } from 'vue';
import {
  fetchRemoteUserProfile,
  upsertRemoteUserProfile,
} from '@/services/userProfiles.repository';
import type { CurrentUser } from '@/types/event';
import type { UserProfile } from '@/types/profile';
import { loadProfileFromStorage, saveProfileToStorage } from '@/utils/storage';

export const avatarEmojiOptions = [
  '😀',
  '😎',
  '🥳',
  '🤠',
  '😇',
  '🤝',
  '🔥',
  '🍕',
  '🎉',
  '🏃‍♂️',
  '🏃‍♀️',
  '🧑‍💻',
  '🙋‍♂️',
  '🙋‍♀️',
  '🐱',
  '🐶',
] as const;

const defaultProfile: UserProfile = {
  displayName: '',
  avatarEmoji: avatarEmojiOptions[0],
};

const isKnownAvatarEmoji = (emoji: string) => {
  return avatarEmojiOptions.includes(emoji as (typeof avatarEmojiOptions)[number]);
};

const normalizeProfile = (nextProfile: UserProfile): UserProfile => {
  return {
    displayName: nextProfile.displayName.trim(),
    avatarEmoji: isKnownAvatarEmoji(nextProfile.avatarEmoji)
        ? nextProfile.avatarEmoji
        : defaultProfile.avatarEmoji,
  };
};

const profile = ref<UserProfile>({
  ...defaultProfile,
  ...loadProfileFromStorage(),
});

if (!isKnownAvatarEmoji(profile.value.avatarEmoji)) {
  profile.value.avatarEmoji = defaultProfile.avatarEmoji;
}

const isProfileSyncing = ref(false);
const profileSyncError = ref<string | null>(null);

export const useUserProfile = () => {
  const saveLocalProfile = (nextProfile: UserProfile) => {
    const normalizedProfile = normalizeProfile(nextProfile);

    profile.value = normalizedProfile;
    saveProfileToStorage(normalizedProfile);

    return normalizedProfile;
  };

  const hydrateProfileFromRemote = async (user: CurrentUser | null) => {
    if (!user) {
      return;
    }

    isProfileSyncing.value = true;
    profileSyncError.value = null;

    const result = await fetchRemoteUserProfile(user);

    isProfileSyncing.value = false;

    if (result.error) {
      profileSyncError.value = result.error;
      return;
    }

    if (!result.data) {
      return;
    }

    saveLocalProfile(result.data);
  };

  const saveProfile = async (
      nextProfile: UserProfile,
      user?: CurrentUser | null,
  ) => {
    const normalizedProfile = saveLocalProfile(nextProfile);

    if (!user) {
      return {
        data: normalizedProfile,
        error: null,
      };
    }

    isProfileSyncing.value = true;
    profileSyncError.value = null;

    const result = await upsertRemoteUserProfile(user, normalizedProfile);

    isProfileSyncing.value = false;

    if (result.error) {
      profileSyncError.value = result.error;

      return {
        data: normalizedProfile,
        error: result.error,
      };
    }

    if (result.data) {
      saveLocalProfile(result.data);
    }

    return {
      data: result.data ?? normalizedProfile,
      error: null,
    };
  };

  const avatarEmoji = computed(() => {
    return profile.value.avatarEmoji || defaultProfile.avatarEmoji;
  });

  return {
    avatarEmoji,
    avatarEmojiOptions,
    hydrateProfileFromRemote,
    isProfileSyncing,
    profile,
    profileSyncError,
    saveProfile,
  };
};