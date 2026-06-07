/** Имя бота из env (без «@»). Используется виджетом логина и для ссылки на бота. */
export const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string

/** Прямая ссылка на бота в Telegram. */
export const TELEGRAM_BOT_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`
