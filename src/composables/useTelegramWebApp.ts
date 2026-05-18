import { computed } from 'vue';

import type { TelegramWebApp, TelegramWebAppUser } from '@/types/telegram';

const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
};

export const useTelegramWebApp = () => {
  const webApp = computed(() => getTelegramWebApp());

  const isTelegram = computed(() => {
    return Boolean(webApp.value);
  });

  const telegramUser = computed<TelegramWebAppUser | null>(() => {
    return webApp.value?.initDataUnsafe?.user ?? null;
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
    telegramUser,
    initTelegramApp,
    showMainButton,
    showBackButton,
    openTelegramLink,
  };
};