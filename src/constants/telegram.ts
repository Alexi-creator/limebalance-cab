import { getEnv } from "@constants/env"

/** Bot name from env (without "@"). Used by the login widget and for the bot link. */
export const TELEGRAM_BOT_USERNAME = getEnv("VITE_TELEGRAM_BOT_USERNAME")

/** Direct link to the bot in Telegram. */
export const TELEGRAM_BOT_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`
