const localeToCurrency: Record<string, string> = {
  ru: "RUB",
  en: "USD",
}

/**
 * Formats an amount as currency. `currencyCode` — an explicit code (ISO 4217) for a specific
 * transaction; if omitted, the currency is taken from the interface language (fallback USD).
 */
export function formatCurrency(
  amount: number,
  locale: string,
  currencyCode?: string | null,
): string {
  const currency = currencyCode || localeToCurrency[locale] || "USD"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
