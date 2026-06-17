import { formatCurrency } from "@utils/formatCurrency"
import type { TFunction } from "i18next"

export interface Kpi {
  /** Стабильный ключ для списка. */
  key: string
  label: string
  value: string
  sub?: string
  trend?: number
  accent?: string
  /** Показывает скелетон вместо карточки, пока грузятся данные. */
  loading?: boolean
  onRefresh?: () => void
  isRefreshing?: boolean
}

/** Динамическая метрика (доход/расход за текущий месяц) для сборки KPI. */
export interface KpiMetric {
  /** Сумма за текущий месяц. */
  total: number
  /** Есть ли запись за текущий месяц в сводке. */
  hasData: boolean
  loading: boolean
  isFetching: boolean
  refetch: () => void
}

/** Общий баланс по всем счетам (из GET /transactions/balance). */
export interface BalanceMetric {
  /** Баланс в базовой валюте; null, если курсы недоступны — показываем «—». */
  total: number | null
  /** Тот же баланс в USD (для подписи под значением); null — если курсы недоступны. */
  usd: number | null
  /** Базовая валюта баланса (может отличаться от валюты сводок). */
  baseCurrency?: string
  loading: boolean
}

interface BuildKpisParams {
  t: TFunction
  language: string
  /** Базовая валюта пользователя — в ней показываем доход/расход (approxTotal). */
  baseCurrency?: string
  balance: BalanceMetric
  income: KpiMetric
  expense: KpiMetric
}

/** Цвет значения по знаку: отрицательное (ведущий «−»/«-») — красный, иначе зелёный. */
function colorBySign(value: string): string {
  const v = value.trimStart()
  const negative = v.startsWith("−") || v.startsWith("-")
  return negative ? "var(--mantine-color-red-5)" : "var(--mantine-color-green-5)"
}

/** Собирает массив KPI-карточек главной из статичных значений и метрик доход/расход. */
export function buildKpis({
  t,
  language,
  baseCurrency,
  balance,
  income,
  expense,
}: BuildKpisParams): Kpi[] {
  // накоплено за месяц = доход − расход (в базовой валюте)
  const savedLoading = income.loading || expense.loading
  const savedTotal = income.total - expense.total
  const savedValue = savedLoading
    ? "—"
    : `${savedTotal >= 0 ? "+" : "−"}${formatCurrency(Math.abs(savedTotal), language, baseCurrency)}`

  // баланс приходит в своей базовой валюте; null (нет курсов) → «—»
  const balanceValue =
    balance.loading || balance.total == null
      ? "—"
      : formatCurrency(balance.total, language, balance.baseCurrency)
  // под значением — эквивалент в USD; если курсы недоступны, оставляем подпись по умолчанию
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
