const EVENT_ID_PREFIX = 'event_';
const SESSION_ID_PREFIX = 'session_';

const TELEGRAM_LAUNCH_KEYS = [
    'tgWebAppData',
    'tgWebAppVersion',
    'tgWebAppPlatform',
    'tgWebAppThemeParams',
    'tgWebAppStartParam',
];

export type TelegramStartPayload =
    | {
    type: 'event';
    id: string;
}
    | {
    type: 'session';
    id: string;
};

const parseStartPayload = (value: string | null): TelegramStartPayload | null => {
    if (!value) {
        return null;
    }

    if (value.startsWith(EVENT_ID_PREFIX)) {
        return {
            type: 'event',
            id: value,
        };
    }

    if (value.startsWith(SESSION_ID_PREFIX)) {
        return {
            type: 'session',
            id: value,
        };
    }

    return null;
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

export const getTelegramStartPayload = (): TelegramStartPayload | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const telegramStartParam =
        window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? null;

    const payloadFromTelegram = parseStartPayload(telegramStartParam);

    if (payloadFromTelegram) {
        return payloadFromTelegram;
    }

    const searchParams = new URLSearchParams(window.location.search);

    const queryStartParam =
        searchParams.get('tgWebAppStartParam') ??
        searchParams.get('startapp');

    const payloadFromQuery = parseStartPayload(queryStartParam);

    if (payloadFromQuery) {
        return payloadFromQuery;
    }

    const hashParams = getNormalizedHashParams();

    const hashStartParam =
        hashParams.get('tgWebAppStartParam') ??
        hashParams.get('startapp');

    return parseStartPayload(hashStartParam);
};