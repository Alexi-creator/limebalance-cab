/**
 * Everything in the investing section is USD/USDT (no conversion to the user's base
 * currency yet), so formatting lives here instead of the app-wide currency helper.
 * Crypto prices span many orders of magnitude — small values keep more decimals.
 */
export function formatUsd(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(value) < 1 ? 6 : 2,
  }).format(value)
}

/** Signed PnL, e.g. "+$12.40" / "−$3.05" — the sign carries the meaning. */
export function formatPnl(value: number, locale: string): string {
  const formatted = formatUsd(Math.abs(value), locale)
  return value >= 0 ? `+${formatted}` : `−${formatted}`
}

/** Quantity / amount without a currency symbol; up to 8 decimals for small coins. */
export function formatQty(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 8 }).format(value)
}

export function pnlColor(value: number | null): string {
  if (value == null || value === 0) return "dimmed"
  return value > 0 ? "green.5" : "red.5"
}
