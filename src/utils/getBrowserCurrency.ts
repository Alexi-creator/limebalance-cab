import { regionToCurrency } from "@constants/regionToCurrency"

/**
 * Определяет валюту по умолчанию из локали браузера: берёт регион (при необходимости
 * достраивая локаль через maximize, напр. «en» → «en-US») и маппит его в ISO 4217.
 * Если регион не распознан — возвращает undefined (дефолт подставит бэкенд); пользователь
 * сможет сменить валюту позже в настройках.
 */
export function getBrowserCurrency(): string | undefined {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    if (region) return regionToCurrency[region]
  } catch {
    // невалидная локаль — пусть бэкенд подставит дефолт
  }
  return undefined
}
