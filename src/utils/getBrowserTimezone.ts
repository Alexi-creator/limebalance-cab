/**
 * IANA-таймзона браузера из `Intl` (напр. «Asia/Bangkok»).
 * Шлётся при регистрации/входе — по ней бэкенд выводит дефолтную валюту аккаунта.
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
