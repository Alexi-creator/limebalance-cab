/** Region (ISO 3166-1 alpha-2) → currency code (ISO 4217). Covers common countries; */
/* a fallback is used for the rest. The list can be extended as needed. */
export const regionToCurrency: Record<string, string> = {
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  RU: "RUB",
  UA: "UAH",
  BY: "BYN",
  KZ: "KZT",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  CN: "CNY",
  HK: "HKD",
  TW: "TWD",
  KR: "KRW",
  IN: "INR",
  ID: "IDR",
  TH: "THB",
  VN: "VND",
  PH: "PHP",
  MY: "MYR",
  SG: "SGD",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  TR: "TRY",
  IL: "ILS",
  AE: "AED",
  SA: "SAR",
  EG: "EGP",
  ZA: "ZAR",
  NG: "NGN",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  UY: "UYU",
  // Eurozone
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  FI: "EUR",
  GR: "EUR",
  SK: "EUR",
  SI: "EUR",
  LT: "EUR",
  LV: "EUR",
  EE: "EUR",
  LU: "EUR",
  CY: "EUR",
  MT: "EUR",
  HR: "EUR",
}

/** Unique currency codes from the map, alphabetized — the option list for choosing currency in settings. */
export const CURRENCY_CODES = [...new Set(Object.values(regionToCurrency))].sort()

/**
 * The currency's symbol, or null when there isn't a distinct one. A fixed locale is used on purpose:
 * the symbol should read the same whatever the interface language is, and `narrowSymbol` picks the
 * short local form ($, not US$). For currencies without a symbol CLDR returns the code itself — those
 * keep just the code instead of repeating it.
 */
function currencySymbol(code: string): string | null {
  const symbol = new Intl.NumberFormat("en", {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value
  return symbol && symbol !== code ? symbol : null
}

/**
 * Options for the currency Select: the code with its symbol (`THB ฿`), or the bare code where there
 * is none (`AED`). The code comes first so that typing it still filters the list from the first letter.
 */
export const CURRENCY_OPTIONS = CURRENCY_CODES.map((code) => {
  const symbol = currencySymbol(code)
  return { value: code, label: symbol ? `${code} ${symbol}` : code }
})
