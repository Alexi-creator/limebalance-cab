const localeToCurrency: Record<string, string> = {
  ru: "RUB",
  en: "USD",
}

/**
 * Форматирует сумму как валюту. `currencyCode` — явный код (ISO 4217) для конкретной
 * операции; если не передан, берётся валюта по языку интерфейса (фолбэк USD).
 */
export function formatCurrency(amount: number, locale: string, currencyCode?: string | null): string {
  const currency = currencyCode || localeToCurrency[locale] || "USD"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
