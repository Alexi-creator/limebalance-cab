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
  income: KpiMetric
  expense: KpiMetric
}

/** Собирает массив KPI-карточек главной из статичных значений и метрик доход/расход. */
export function buildKpis({ language, income, expense }: BuildKpisParams): Kpi[] {
  return [
    {
      key: "balance",
      label: "Текущий баланс",
      value: "284 540 ₽",
      sub: "по всем счетам",
      trend: 12.4,
      accent: "var(--mantine-color-lime-4)",
    },
    {
      key: "income",
      label: "Доход за месяц",
      value: income.loading ? "—" : formatCurrency(income.total, language),
      sub: income.hasData ? "за текущий месяц" : "нет данных",
      trend: 8.2,
      loading: income.loading,
      onRefresh: income.refetch,
      isRefreshing: income.isFetching,
    },
    {
      key: "expense",
      label: "Расход за месяц",
      value: expense.loading ? "—" : formatCurrency(-expense.total, language),
      sub: expense.hasData ? "за текущий месяц" : "нет данных",
      trend: -3.7,
      loading: expense.loading,
      onRefresh: expense.refetch,
      isRefreshing: expense.isFetching,
    },
    {
      key: "saved",
      label: "Накоплено в мае",
      value: "+90 480 ₽",
      sub: "лучший месяц в году",
      trend: 28.5,
    },
  ]
}
