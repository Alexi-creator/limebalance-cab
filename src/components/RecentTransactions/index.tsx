import { getExpenseCategories } from "@api/expenses"
import { getIncomeCategories } from "@api/incomes"
import { getTransactions } from "@api/transactions"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { TRANSACTIONS_STALE_TIME, transactionKeys } from "@constants/queries/transactions"
import { RouteNames } from "@constants/routeNames"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Button, Center, Group, Paper, Skeleton, Stack, Text } from "@mantine/core"
import { IconTag } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { formatTxAmount } from "../transactions/helpers"

const RECENT_LIMIT = 7

/**
 * Recent transactions widget on the home dashboard: the last 7 records from /transactions
 * (already sorted by date desc.). A row is amount + currency + category.
 */
export function RecentTransactions() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS

  const { data, isLoading, isError } = useQuery({
    queryKey: transactionKeys.recent(RECENT_LIMIT),
    queryFn: () => getTransactions({ page: 1, limit: RECENT_LIMIT }),
    staleTime: TRANSACTIONS_STALE_TIME,
  })

  // we pull category emojis from the lists cache (also deduplicated with the transactions table)
  const { data: expenseCategories } = useQuery({
    queryKey: expenseKeys.categories,
    queryFn: getExpenseCategories,
    staleTime: CATEGORY_STALE_TIME,
  })
  const { data: incomeCategories } = useQuery({
    queryKey: incomeKeys.categories,
    queryFn: getIncomeCategories,
    staleTime: CATEGORY_STALE_TIME,
  })

  const emojiByCategoryId = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of [...(expenseCategories ?? []), ...(incomeCategories ?? [])]) {
      if (c.emoji) map.set(c.id, c.emoji)
    }
    return map
  }, [expenseCategories, incomeCategories])

  const items = data?.items ?? []

  return (
    <Paper data-tour="transactions">
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Stack gap={2}>
          <Text fw={600} size="sm">
            {t("home.recent_title")}
          </Text>
          <Text size="xs" c="dimmed">
            {t("home.recent_subtitle", { count: RECENT_LIMIT })}
          </Text>
        </Stack>
        <Button variant="subtle" size="xs" onClick={() => navigate(RouteNames.Transactions)}>
          {t("home.recent_show_all")}
        </Button>
      </Group>

      {isLoading ? (
        <Stack gap={0} p="md">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static loading placeholders
            <Skeleton key={i} h={40} my={6} radius="sm" />
          ))}
        </Stack>
      ) : isError ? (
        <Text c="red.5" ta="center" p="xl">
          {t("transactions.load_error")}
        </Text>
      ) : items.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          {t("home.recent_empty")}
        </Text>
      ) : (
        items.map((t, i) => (
          <Group
            key={`${t.type}-${t.id}`}
            px="md"
            py="sm"
            wrap="nowrap"
            gap="sm"
            style={{
              borderBottom:
                i < items.length - 1 ? "1px solid var(--mantine-color-default-border)" : "none",
            }}
          >
            <Center
              w={32}
              h={32}
              style={{
                borderRadius: 8,
                background: "var(--mantine-color-default-hover)",
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {emojiByCategoryId.get(t.categoryId) ?? <IconTag size={16} opacity={0.5} />}
            </Center>
            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" truncate>
                {t.description || t.categoryName || "—"}
              </Text>
              <Text size="xs" c="dimmed">
                {t.categoryName ?? "—"}
              </Text>
            </Stack>
            <Text size="xs" c="dimmed" visibleFrom="xs">
              {format(t.date, "d MMM", { locale })}
            </Text>
            <Text
              ff="monospace"
              size="sm"
              fw={500}
              c={t.type === "income" ? "green.5" : "red.5"}
              ta="right"
              style={{ flexShrink: 0 }}
            >
              {formatTxAmount(t, i18n.language)}
            </Text>
          </Group>
        ))
      )}
    </Paper>
  )
}
