export const getTelegramStartParam = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const telegramStartParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;

    if (telegramStartParam) {
        return telegramStartParam;
    }

    const searchParams = new URLSearchParams(window.location.search);

    return searchParams.get('tgWebAppStartParam') ?? searchParams.get('startapp');
};