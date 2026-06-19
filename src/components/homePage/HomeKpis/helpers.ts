import { formatCurrency } from "@utils/formatCurrency"
import type { TFunction } from "i18next"

export interface Kpi {
  /** Stable key for the list. */
  key: string
  label: string
  value: string
  sub?: string
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
}

/** Value color by sign: negative (leading "−"/"-") — red, otherwise green. */
function colorBySign(value: string): string {
  const v = value.trimStart()
  const negative = v.startsWith("−") || v.startsWith("-")
  return negative ? "var(--mantine-color-red-5)" : "var(--mantine-color-green-5)"
}

/** Builds the home KPI card array from static values and income/expense metrics. */
export function buildKpis({
  t,
  language,
  baseCurrency,
  balance,
  income,
  expense,
}: BuildKpisParams): Kpi[] {
  // saved for the month = income − expense (in the base currency)
  const savedLoading = income.loading || expense.loading
  const savedTotal = income.total - expense.total
  const savedValue = savedLoading
    ? "—"
    : `${savedTotal >= 0 ? "+" : "−"}${formatCurrency(Math.abs(savedTotal), language, baseCurrency)}`

  // the balance comes in its own base currency; null (no rates) → "—"
  const balanceValue =
    balance.loading || balance.total == null
      ? "—"
      : formatCurrency(balance.total, language, balance.baseCurrency)
  // under the value — the USD equivalent; if rates are unavailable, keep the default caption
  const balanceSub =
    !balance.loading && balance.usd != null
      ? `≈ ${formatCurrency(balance.usd, language, "USD")}`
      : t("home.kpi_balance_sub_all")

  return [
    {
      key: "balance",
      label: t("home.kpi_balance"),
      value: balanceValue,
      sub: balanceSub,
      accent: balance.total != null ? colorBySign(balanceValue) : undefined,
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
      accent: savedLoading ? undefined : colorBySign(savedValue),
      loading: savedLoading,
    },
  ]
}
