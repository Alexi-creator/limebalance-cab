import { formatCurrency } from "@utils/formatCurrency"

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

interface BuildKpisParams {
  language: string
  /** Базовая валюта пользователя — в ней показываем доход/расход (approxTotal). */
  baseCurrency?: string
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
export function buildKpis({ language, baseCurrency, income, expense }: BuildKpisParams): Kpi[] {
  // накоплено за месяц = доход − расход (в базовой валюте)
  const savedLoading = income.loading || expense.loading
  const savedTotal = income.total - expense.total
  const savedValue = savedLoading
    ? "—"
    : `${savedTotal >= 0 ? "+" : "−"}${formatCurrency(Math.abs(savedTotal), language, baseCurrency)}`

  return [
    {
      key: "balance",
      label: "Текущий баланс",
      value: "284 540 ₽",
      sub: "по всем счетам",
      trend: 12.4,
      accent: colorBySign("284 540 ₽"),
    },
    {
      key: "income",
      label: "Доход за месяц",
      value: income.loading ? "—" : formatCurrency(income.total, language, baseCurrency),
      sub: income.hasData ? "за текущий месяц" : "нет данных",
      accent: "var(--mantine-color-green-5)",
      trend: 8.2,
      loading: income.loading,
      onRefresh: income.refetch,
      isRefreshing: income.isFetching,
    },
    {
      key: "expense",
      label: "Расход за месяц",
      value: expense.loading ? "—" : formatCurrency(-expense.total, language, baseCurrency),
      sub: expense.hasData ? "за текущий месяц" : "нет данных",
      accent: "var(--mantine-color-red-5)",
      trend: -3.7,
      loading: expense.loading,
      onRefresh: expense.refetch,
      isRefreshing: expense.isFetching,
    },
    {
      key: "saved",
      label: "Накоплено за месяц",
      value: savedValue,
      sub: "доход − расход",
      accent: savedLoading ? undefined : colorBySign(savedValue),
      loading: savedLoading,
    },
  ]
}
