type EnvKey = "VITE_API_URL" | "VITE_TELEGRAM_BOT_USERNAME" | "VITE_GOOGLE_CLIENT_ID"

const runtime = (window as unknown as { __ENV__?: Record<string, string> }).__ENV__ ?? {}

/**
 * Единая точка чтения env-переменных.
 * Прод: значения из window.__ENV__ (env-config.js, сгенерён контейнером при старте).
 * Dev: фолбэк на import.meta.env (Vite читает .env на этапе build/dev).
 */
export function getEnv(key: EnvKey): string {
  return runtime[key] || (import.meta.env[key] as string)
}
