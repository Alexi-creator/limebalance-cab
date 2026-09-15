import { ActionIcon, SimpleGrid, Skeleton, Tooltip } from "@mantine/core"
import { IconAlertTriangle } from "@tabler/icons-react"
import { endOfMonth, startOfMonth } from "date-fns"
import { useTranslation } from "react-i18next"
import { useSummaries } from "@/modules/analytics/api/useSummaries"
import { ExchangeFormModal } from "@/modules/exchanges/ui"
import { useBalance } from "@/modules/transactions/api/useBalance"
import { useModalStore } from "@/shared/store/modalStore"
import { KpiCard } from "@/shared/ui/KpiCard"
import { buildKpis, findUnrecordedExchange } from "./helpers"

/**
 * Row of KPI cards on the home page. Fetches the total balance (/transactions/balance) and
 * income/expense summaries for the current month (granularity=day — deduplicated with the chart
 * by the same keys), then builds the cards via `buildKpis`.
 */
export function HomeKpis() {
  const { t, i18n } = useTranslation()
  const openModal = useModalStore((s) => s.open)
  const now = new Date()
  const from = startOfMonth(now)
  // whole month (to=end of month) — shared key/range with the chart; future days are empty
  const to = endOfMonth(now)
  const balanceQuery = useBalance()
  const { expenses: expensesQuery, incomes: incomesQuery } = useSummaries({
    from,
    to,
    granularity: "day",
  })

  // whether there is at least one transaction in the period (for the "no data" caption)
  const incomeHasData = (incomesQuery.data?.buckets ?? []).some((b) => b.totals.length > 0)
  const expenseHasData = (expensesQuery.data?.buckets ?? []).some((b) => b.totals.length > 0)

  // user's base currency — the summary approxTotal/total come in it
  const baseCurrency = incomesQuery.data?.baseCurrency ?? expensesQuery.data?.baseCurrency

  // A negative balance in one currency next to a positive one in another means money was
  // converted and never recorded. Say so right where it shows, instead of leaving a wrong-looking
  // number unexplained — this is the only moment the exchange feature is actually relevant.
  const shortfallCurrency = findUnrecordedExchange(balanceQuery.data?.byCurrency)
  const balanceAlert = shortfallCurrency ? (
    // A marker in the card header, not a paragraph under the value: the explanation has to be
    // reachable without making this card taller than the three beside it.
    <Tooltip
      label={t("home.balance_missing_exchange", { currency: shortfallCurrency })}
      multiline
      w={260}
      withArrow
      events={{ hover: true, focus: true, touch: true }}
    >
      <ActionIcon
        variant="subtle"
        color="orange"
        size="sm"
        data-tour="balance-hint"
        aria-label={t("home.balance_record_exchange")}
        onClick={() => openModal({ size: "lg", centered: true, children: <ExchangeFormModal /> })}
      >
        <IconAlertTriangle size={16} />
      </ActionIcon>
    </Tooltip>
  ) : undefined

  const kpis = buildKpis({
    t,
    language: i18n.language,
    baseCurrency,
    balance: {
      total: balanceQuery.data?.balance ?? null,
      usd: balanceQuery.data?.balanceUsd ?? null,
      baseCurrency: balanceQuery.data?.baseCurrency,
      byCurrency: balanceQuery.data?.byCurrency,
      isApproximate: balanceQuery.data?.isApproximate,
      inExchanges: balanceQuery.data?.inExchanges,
      loading: balanceQuery.isLoading,
    },
    income: {
      total: incomesQuery.data?.total ?? 0,
      hasData: incomeHasData,
      loading: incomesQuery.isLoading,
      isFetching: incomesQuery.isFetching,
      refetch: incomesQuery.refetch,
    },
    expense: {
      total: expensesQuery.data?.total ?? 0,
      hasData: expenseHasData,
      loading: expensesQuery.isLoading,
      isFetching: expensesQuery.isFetching,
      refetch: expensesQuery.refetch,
    },
    balanceAlert,
  })

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" data-tour="kpis">
      {kpis.map(({ key, loading, ...card }) => (
        <Skeleton
          key={key}
          visible={loading ?? false}
          radius="md"
          // The balance card gets its own tour step: it is the one that needs the multicurrency
          // explanation.
          data-tour={key === "balance" ? "balance" : undefined}
        >
          <KpiCard {...card} />
        </Skeleton>
      ))}
    </SimpleGrid>
  )
}
