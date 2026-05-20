import { computed, ref } from 'vue';
import {
  avatarEmojiOptions,
  avatarOptions,
  defaultAvatarEmoji,
  isKnownAvatarEmoji,
} from '@/data/avatarOptions';
import type { CurrentUser } from '@/types/event';
import type { UserProfile } from '@/types/profile';
import { loadProfileFromStorage, saveProfileToStorage } from '@/utils/storage';

const defaultProfile: UserProfile = {
  displayName: '',
  avatarEmoji: defaultAvatarEmoji,
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
  const saveProfile = async (
      nextProfile: UserProfile,
      _user?: CurrentUser | null,
  ) => {
    const normalizedProfile: UserProfile = {
      displayName: nextProfile.displayName.trim(),
      avatarEmoji: isKnownAvatarEmoji(nextProfile.avatarEmoji)
          ? nextProfile.avatarEmoji
          : defaultProfile.avatarEmoji,
    };

    profile.value = normalizedProfile;
    saveProfileToStorage(normalizedProfile);

    return {
      data: normalizedProfile,
      error: null,
    };
  };

  const hydrateProfileFromRemote = async (_user?: CurrentUser | null) => {
    profileSyncError.value = null;

    return {
      data: profile.value,
      error: null,
    };
  };

  const avatarEmoji = computed(() => {
    return profile.value.avatarEmoji || defaultProfile.avatarEmoji;
  });

  return {
    avatarEmoji,
    avatarEmojiOptions,
    avatarOptions,
    hydrateProfileFromRemote,
    isProfileSyncing,
    profile,
    profileSyncError,
    saveProfile,
  };
};