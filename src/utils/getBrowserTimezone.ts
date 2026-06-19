/**
 * Browser IANA timezone from `Intl` (e.g. "Asia/Bangkok").
 * Sent on registration/login — the backend derives the account's default currency from it.
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
