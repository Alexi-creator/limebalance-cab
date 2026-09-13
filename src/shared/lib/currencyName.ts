/**
 * Intl.DisplayNames is not free to construct, and the option list rebuilds it for every currency,
 * so instances are kept per locale.
 */
const formatters = new Map<string, Intl.DisplayNames>()

function displayNames(locale: string): Intl.DisplayNames {
  const cached = formatters.get(locale)
  if (cached) return cached
  const formatter = new Intl.DisplayNames([locale, "en"], { type: "currency" })
  formatters.set(locale, formatter)
  return formatter
}

/**
 * The currency's name in the interface language ("доллар США", "US Dollar", "美元"). CLDR ships these
 * for every ISO 4217 code in every locale we support, so nothing has to be translated by hand; the
 * code itself is the fallback when a runtime has no data for it.
 */
export function currencyName(code: string, locale: string): string {
  return displayNames(locale).of(code) ?? code
}
