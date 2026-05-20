import { computed } from 'vue';

import { useUserProfile } from '@/composables/useUserProfile';
import type { CurrentUser } from '@/types/event';
import type { TelegramWebApp, TelegramWebAppUser } from '@/types/telegram';

const WEB_USER_STORAGE_KEY = 'sobiraemsya_web_user_id';

const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
};

const createWebUserId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `web_${crypto.randomUUID()}`;
  }

  return `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const getWebFallbackUser = (): CurrentUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  let userId = window.localStorage.getItem(WEB_USER_STORAGE_KEY);

  if (!userId) {
    userId = createWebUserId();
    window.localStorage.setItem(WEB_USER_STORAGE_KEY, userId);
  }

  return {
    id: userId,
    name: 'Гость',
  };
};

const getTelegramUserName = (user: TelegramWebAppUser) => {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();

  if (fullName) {
    return fullName;
  }

  if (user.username) {
    return `@${user.username}`;
  }

  return `Пользователь ${user.id}`;
};

const mapTelegramUserToCurrentUser = (user: TelegramWebAppUser): CurrentUser => {
  return {
    id: String(user.id),
    telegramId: user.id,
    username: user.username,
    name: getTelegramUserName(user),
  };
};

export const useTelegramWebApp = () => {
  const { avatarEmoji, profile } = useUserProfile();
  const webApp = computed(() => getTelegramWebApp());

  const isTelegram = computed(() => {
    return Boolean(webApp.value);
  });

  const telegramUser = computed(() => {
    return webApp.value?.initDataUnsafe?.user ?? null;
  });

  const currentUser = computed<CurrentUser | null>(() => {
    const profileName = profile.value.displayName.trim();

    if (telegramUser.value) {
      const user = mapTelegramUserToCurrentUser(telegramUser.value);

      return {
        ...user,
        avatarEmoji: avatarEmoji.value,
      };
    }

    const fallbackUser = getWebFallbackUser();

    if (!fallbackUser) {
      return null;
    }

    return {
      ...fallbackUser,
      name: profileName || fallbackUser.name,
      avatarEmoji: avatarEmoji.value,
    };
  });

  const initTelegramApp = () => {
    const telegramWebApp = getTelegramWebApp();

    if (!telegramWebApp) {
      return;
    }

    telegramWebApp.ready?.();
    telegramWebApp.expand?.();
  };

  const showMainButton = (text: string, onClick: () => void) => {
    const telegramWebApp = getTelegramWebApp();
    const mainButton = telegramWebApp?.MainButton;

    if (!mainButton) {
      return () => {};
    }

    mainButton.setText(text);
    mainButton.show();
    mainButton.onClick(onClick);

    return () => {
      mainButton.offClick(onClick);
      mainButton.hide();
    };
  };

  const showBackButton = (onClick: () => void) => {
    const telegramWebApp = getTelegramWebApp();
    const backButton = telegramWebApp?.BackButton;

    if (!backButton) {
      return () => {};
    }

    backButton.show();
    backButton.onClick(onClick);

    return () => {
      backButton.offClick(onClick);
      backButton.hide();
    };
  };

  const openTelegramLink = (url: string) => {
    const telegramWebApp = getTelegramWebApp();

    if (telegramWebApp?.openTelegramLink) {
      telegramWebApp.openTelegramLink(url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return {
    webApp,
    isTelegram,
    telegramUser,
    currentUser,
    initTelegramApp,
    showMainButton,
    showBackButton,
    openTelegramLink,
  };
};
