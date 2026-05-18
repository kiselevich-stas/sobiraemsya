const EVENT_ID_PREFIX = 'event_';

const TELEGRAM_LAUNCH_KEYS = [
    'tgWebAppData',
    'tgWebAppVersion',
    'tgWebAppPlatform',
    'tgWebAppThemeParams',
    'tgWebAppStartParam',
];

const isEventId = (value: string | null): value is string => {
    return Boolean(value && value.startsWith(EVENT_ID_PREFIX));
};

const getNormalizedHashParams = () => {
    if (typeof window === 'undefined') {
        return new URLSearchParams();
    }

    const normalizedHash = window.location.hash.replace(/^#\/?/, '');

    return new URLSearchParams(normalizedHash);
};

export const isTelegramLaunchUrl = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    const normalizedHash = window.location.hash.replace(/^#\/?/, '');
    const search = window.location.search.replace(/^\?/, '');

    return TELEGRAM_LAUNCH_KEYS.some((key) => {
        return (
            normalizedHash.startsWith(`${key}=`) ||
            normalizedHash.includes(`&${key}=`) ||
            search.startsWith(`${key}=`) ||
            search.includes(`&${key}=`)
        );
    });
};

export const getTelegramStartParam = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const telegramStartParam =
        window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? null;

    if (isEventId(telegramStartParam)) {
        return telegramStartParam;
    }

    const searchParams = new URLSearchParams(window.location.search);

    const queryStartParam =
        searchParams.get('tgWebAppStartParam') ??
        searchParams.get('startapp');

    if (isEventId(queryStartParam)) {
        return queryStartParam;
    }

    const hashParams = getNormalizedHashParams();

    const hashStartParam =
        hashParams.get('tgWebAppStartParam') ??
        hashParams.get('startapp');

    if (isEventId(hashStartParam)) {
        return hashStartParam;
    }

    return null;
};