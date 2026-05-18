export function getTelegramWebApp() {
    return window.Telegram?.WebApp ?? null
}

export function isTelegramWebApp() {
    return Boolean(window.Telegram?.WebApp)
}