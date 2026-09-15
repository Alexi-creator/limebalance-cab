import type { TFunction } from "i18next"
import type { ReactNode } from "react"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import type { KpiSub, KpiSubLine } from "@/shared/ui/KpiCard"

export interface Kpi {
  /** Stable key for the list. */
  key: string
  label: string
  value: string
  sub?: KpiSub
  /** Rendered among the card's top-right controls — used for the "an exchange looks unrecorded"
   *  marker, which must not make the card taller than its neighbours. */
  alert?: ReactNode
  trend?: number
  accent?: string
  /** Shows a skeleton instead of the card while data is loading. */
  loading?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}

/** Dynamic metric (income/expense for the current month) for building KPIs. */
export interface KpiMetric {
  /** Total for the current month. */
  total: number
  /** Whether there is a record for the current month in the summary. */
  hasData: boolean
  loading: boolean
  isFetching: boolean
  refetch: () => void
}

/** Total balance across all accounts (from GET /transactions/balance). */
export interface BalanceMetric {
  /** Balance in the base currency; null if exchange rates are unavailable — we show "—". */
  total: number | null
  /** The same balance in USD (for the caption under the value); null if exchange rates are unavailable. */
  usd: number | null
  /** Base currency of the balance (may differ from the summaries' currency). */
  baseCurrency?: string
  /** Exact per-currency figures behind `total` — no conversion involved in any of them. */
  byCurrency?: { currency: string; amount: number }[]
  /** Whether `total` required converting a foreign holding at today's rate. */
  isApproximate?: boolean
  /** Worth of everything sitting on exchanges and wallets, base currency; 0 or absent when none. */
  inExchanges?: number | null
  loading: boolean
}

interface BuildKpisParams {
  t: TFunction
  language: string
  /** User's base currency — we show income/expense in it (approxTotal). */
  baseCurrency?: string
  balance: BalanceMetric
  income: KpiMetric
  expense: KpiMetric
  /** Marker for the balance card when something about the balance needs explaining. */
  balanceAlert?: ReactNode
}

/**
 * The currency whose balance looks impossible, or null when nothing is off.
 *
 * A per-currency balance cannot genuinely go negative — you can't spend more of a currency than
 * ever came in. Negative here, next to a positive balance in another currency, is the signature
 * of money that was converted without the exchange being recorded.
 */
export function findUnrecordedExchange(
  byCurrency: { currency: string; amount: number }[] | undefined,
): string | null {
  const rows = byCurrency ?? []
  const negative = rows.filter((c) => c.amount < 0)
  if (negative.length === 0 || !rows.some((c) => c.amount > 0)) return null
  // Name the currency furthest into the red — the one actually being spent.
  return negative.reduce((worst, c) => (c.amount < worst.amount ? c : worst)).currency
}

/**
 * Value color by sign: negative — red, otherwise green. Read off the number rather than the
 * formatted string, which carries prefixes ("≈ ") and locale-dependent symbol placement.
 */
function colorBySign(value: number): string {
  return value < 0 ? "var(--mantine-color-red-5)" : "var(--mantine-color-green-5)"
}

/** Builds the home KPI card array from static values and income/expense metrics. */
export function buildKpis({
  t,
  language,
  baseCurrency,
  balance,
  income,
  expense,
  balanceAlert,
}: BuildKpisParams): Kpi[] {
  // saved for the month = income − expense (in the base currency)
  const savedLoading = income.loading || expense.loading
  const savedTotal = income.total - expense.total
  const savedValue = savedLoading
    ? "—"
    : `${savedTotal >= 0 ? "+" : "−"}${formatCurrency(Math.abs(savedTotal), language, baseCurrency)}`

  // The balance comes in its own base currency; null (no rates) → "—". A total that had to
  // convert a foreign holding is an estimate and says so.
  const balanceValue =
    balance.loading || balance.total == null
      ? "—"
      : `${balance.isApproximate ? "≈ " : ""}${formatCurrency(balance.total, language, balance.baseCurrency)}`

  // Under the value: every currency actually held, always — the only way to notice money that was
  // never converted is to see it sitting there. A negative bucket is shown too rather than hidden:
  // it is the signature of an exchange that was not recorded, and the orange marker beside the
  // card explains what to do about it. Hiding the split until then meant finding out by going
  // into the red first.
  const held = (balance.byCurrency ?? []).filter((c) => c.amount !== 0)
  const currencyLine: string | KpiSubLine = balance.loading
    ? t("home.kpi_balance_sub_all")
    : held.length > 0
      ? {
          text: held.map((c) => formatCurrency(c.amount, language, c.currency)).join("  +  "),
          // Explained only once there is more than one bucket. A split is the moment the card
          // stops being self-evident: the exact figures here and the converted total above are
          // answering different questions, and a second currency appearing out of nowhere is
          // usually the first sign of a move recorded in the wrong one.
          hint:
            held.length > 1
              ? t("home.kpi_balance_currencies_hint", { currency: balance.baseCurrency })
              : undefined,
        }
      : balance.usd != null
        ? `≈ ${formatCurrency(balance.usd, language, "USD")}`
        : t("home.kpi_balance_sub_all")

  // Money that left the balance to work elsewhere, at what it is worth today. Kept on its own line
  // rather than folded into the figure above: it is not free money, but it is still yours, and a
  // balance that simply omits it reads as if it disappeared.
  const balanceSub: KpiSub =
    !balance.loading && balance.inExchanges
      ? [
          currencyLine,
          {
            text: t("home.kpi_balance_in_exchanges", {
              amount: formatCurrency(balance.inExchanges, language, balance.baseCurrency),
            }),
            // The line every reader tries to add to the value above. Say outright that it is
            // already out of it, and that the figure is today's worth rather than what was sent.
            hint: t("home.kpi_balance_in_exchanges_hint"),
          },
        ]
      : currencyLine

  return [
    {
      key: "balance",
      label: t("home.kpi_balance"),
      value: balanceValue,
      sub: balanceSub,
      alert: balanceAlert,
      accent: balance.total != null ? colorBySign(balance.total) : undefined,
      loading: balance.loading,
    },
    {
      key: "income",
      label: t("home.kpi_income"),
      value: income.loading ? "—" : formatCurrency(income.total, language, baseCurrency),
      sub: income.hasData ? t("home.kpi_this_month") : t("home.kpi_no_data"),
      accent: "var(--mantine-color-green-5)",
      loading: income.loading,
      onRefresh: income.refetch,
      isRefreshing: income.isFetching,
    },
    {
      key: "expense",
      label: t("home.kpi_expense"),
      value: expense.loading ? "—" : formatCurrency(-expense.total, language, baseCurrency),
      sub: expense.hasData ? t("home.kpi_this_month") : t("home.kpi_no_data"),
      accent: "var(--mantine-color-red-5)",
      loading: expense.loading,
      onRefresh: expense.refetch,
      isRefreshing: expense.isFetching,
    },
    {
      key: "saved",
      label: t("home.kpi_saved"),
      value: savedValue,
      sub: t("home.kpi_saved_sub"),
      accent: savedLoading ? undefined : colorBySign(savedTotal),
      loading: savedLoading,
    },
  ]
}
