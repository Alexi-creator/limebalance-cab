import { getEnv } from "@/shared/config/env"

/** Bot name from env (without "@"). Used by the login widget and for the bot link. */
export const TELEGRAM_BOT_USERNAME = getEnv("VITE_TELEGRAM_BOT_USERNAME")

/** Direct link to the bot in Telegram. */
export const TELEGRAM_BOT_URL = `https://t.me/${TELEGRAM_BOT_USERNAME}`

/** Deep link that opens the bot straight in the installed Telegram app. */
export const TELEGRAM_BOT_APP_URL = `tg://resolve?domain=${TELEGRAM_BOT_USERNAME}`

/**
 * Opens the bot in the Telegram app, falling back to the t.me page.
 * t.me in a new tab can't launch the app by itself anymore — browsers block its tg:// redirect
 * since that tab has no user gesture. So we launch tg:// right from the click; if the window
 * keeps focus (no app installed, nothing handled the protocol), we open t.me instead.
 * Must be called synchronously from a click handler.
 */
export function openTelegramBot() {
  let handled = false
  const onBlur = () => {
    handled = true
  }
  window.addEventListener("blur", onBlur, { once: true })
  window.location.href = TELEGRAM_BOT_APP_URL

  window.setTimeout(() => {
    window.removeEventListener("blur", onBlur)
    if (!handled && document.visibilityState === "visible") {
      window.open(TELEGRAM_BOT_URL, "_blank", "noopener,noreferrer")
    }
  }, 1500)
}

/**
 * onClick for `<a href={TELEGRAM_BOT_URL}>`: plain clicks go through {@link openTelegramBot},
 * modified ones (new tab / window) stay regular links.
 */
export function handleTelegramBotLinkClick(e: {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  preventDefault: () => void
}) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  openTelegramBot()
}
