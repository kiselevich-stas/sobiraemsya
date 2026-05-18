import { computed, onMounted, ref } from 'vue';
import type { CurrentUser } from '@/types/event';
import type { TelegramWebApp } from '@/types/telegram';

const webApp = ref<TelegramWebApp | null>(null);

export const useTelegramWebApp = () => {
  const isTelegram = computed(() => Boolean(webApp.value));

  const currentUser = computed<CurrentUser | null>(() => {
    const user = webApp.value?.initDataUnsafe?.user;

    if (!user) {
      return null;
    }

    const nameParts = [user.first_name, user.last_name].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join(' ') : user.username ? `@${user.username}` : 'Гость';

    return {
      id: `tg_${user.id}`,
      telegramId: user.id,
      name,
    };
  });

  const initTelegram = () => {
    if (typeof window === 'undefined') {
      return;
    }

    webApp.value = window.Telegram?.WebApp ?? null;

    if (webApp.value) {
      webApp.value.ready();
      webApp.value.expand();
    }
  };

  const showBackButton = (callback: () => void) => {
    const backButton = webApp.value?.BackButton;
    if (!backButton) {
      return () => undefined;
    }

    backButton.show();
    backButton.onClick(callback);

    return () => {
      backButton.offClick(callback);
      backButton.hide();
    };
  };

  const setMainButton = (text: string, callback: () => void, isActive = true) => {
    const mainButton = webApp.value?.MainButton;
    if (!mainButton) {
      return () => undefined;
    }

    mainButton.setText(text);
    if (isActive) {
      mainButton.enable();
    } else {
      mainButton.disable();
    }
    mainButton.show();
    mainButton.onClick(callback);

    return () => {
      mainButton.offClick(callback);
      mainButton.hide();
    };
  };

  onMounted(initTelegram);

  return {
    webApp,
    isTelegram,
    currentUser,
    initTelegram,
    showBackButton,
    setMainButton,
  };
};
