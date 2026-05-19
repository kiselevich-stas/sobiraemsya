import { computed } from 'vue';

import type { CurrentUser } from '@/types/event';
import type { TelegramWebApp, TelegramWebAppUser } from '@/types/telegram';

const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
};

const mapTelegramUserToCurrentUser = (
    user: TelegramWebAppUser | undefined,
): CurrentUser | null => {
  if (!user) {
    return null;
  }

  const name =
      [user.first_name, user.last_name].filter(Boolean).join(' ') ||
      user.username ||
      `Пользователь ${user.id}`;

  return {
    id: String(user.id),
    telegramId: user.id,
    name,
  };
};

export const useTelegramWebApp = () => {
  const webApp = computed(() => getTelegramWebApp());

  const isTelegram = computed(() => {
    return Boolean(webApp.value);
  });

  const currentUser = computed<CurrentUser | null>(() => {
    return mapTelegramUserToCurrentUser(webApp.value?.initDataUnsafe?.user);
  });

  const initTelegramApp = () => {
    const telegramWebApp = getTelegramWebApp();

    if (!telegramWebApp) {
      return;
    }

    telegramWebApp.ready?.();
    telegramWebApp.expand?.();
  };

  const showMainButton = (
      text: string,
      onClick: () => void,
  ) => {
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
    currentUser,
    initTelegramApp,
    showMainButton,
    showBackButton,
    openTelegramLink,
  };
};