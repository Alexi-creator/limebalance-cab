import { getEnv } from "@constants/env"

/** Имя бота из env (без «@»). Используется виджетом логина и для ссылки на бота. */
export const TELEGRAM_BOT_USERNAME = getEnv("VITE_TELEGRAM_BOT_USERNAME")

/** Прямая ссылка на бота в Telegram. */
export const TELEGRAM_BOT_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`
