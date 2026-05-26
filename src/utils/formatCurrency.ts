const localeToCurrency: Record<string, string> = {
  ru: "RUB",
  en: "USD",
}

export function formatCurrency(amount: number, locale: string): string {
  const currency = localeToCurrency[locale] ?? "USD"
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
