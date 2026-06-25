import { getExpenseCategories } from "@api/expenses"
import { getIncomeCategories } from "@api/incomes"
import { getTransactions } from "@api/transactions"
import type { Transaction } from "@appTypes/transaction"
import { AddModal } from "@components/AddModal"
import { LimitAlert } from "@components/LimitAlert"
import { BulkDeleteModal } from "@components/transactions/BulkDeleteModal"
import { transactionsParamsSchema } from "@components/transactions/config"
import { TransactionsFilters } from "@components/transactions/TransactionsFilters"
import { TransactionsTable } from "@components/transactions/TransactionsTable"
import { TransactionsToolbar } from "@components/transactions/TransactionsToolbar"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { TRANSACTIONS_STALE_TIME, transactionKeys } from "@constants/queries/transactions"
import { RouteNames } from "@constants/routeNames"
import { useUrlParams } from "@hooks/useUrlParams"
import { useUsage } from "@hooks/useUsage"
import {
  Anchor,
  Box,
  Button,
  Group,
  HoverCard,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useModalStore } from "@store/modalStore"
import { IconPlus } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { isLimitBlocked } from "@utils/subscription"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export function TransactionsPage() {
  const { t } = useTranslation()
  const theme = useMantineTheme()
  // below `md` the filters live in a bottom drawer whose handle is fixed to the viewport
  // edge — reserve space so it never covers the table footer/pagination.
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`, true, {
    getInitialValueInEffect: false,
  })
  const [params, setParams] = useUrlParams(transactionsParamsSchema)
  const openModal = useModalStore((s) => s.open)

  const apiParams = {
    type: params.type,
    categoryId: params.categoryId,
    currency: params.currency,
    search: params.search,
    from: params.from,
    to: params.to,
    page: params.page,
    limit: params.limit,
  }

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: transactionKeys.list(apiParams),
    queryFn: () => getTransactions(apiParams),
    placeholderData: keepPreviousData,
    staleTime: TRANSACTIONS_STALE_TIME,
  })

  // categories are needed to determine whether a transaction can be added at all
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

  // both lists are loaded and empty — there is nowhere to add a transaction
  const hasNoCategories =
    !!expenseCategories &&
    !!incomeCategories &&
    expenseCategories.length === 0 &&
    incomeCategories.length === 0

  // monthly transaction limit reached on the current plan — block creating more
  const { data: usage } = useUsage()
  const transactionsBlocked = isLimitBlocked(usage?.transactions)

  const [selectedRecords, setSelectedRecords] = useState<Transaction[]>([])

  const openAddModal = () =>
    openModal({ size: "lg", centered: true, children: <AddModal type="transaction" lockType /> })

  const openBulkDelete = () =>
    openModal({
      centered: true,
      title: (
        <Text fw={600} size="md">
          {t("transactions.bulk_delete_title")}
        </Text>
      ),
      children: (
        <BulkDeleteModal transactions={selectedRecords} onSuccess={() => setSelectedRecords([])} />
      ),
    })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  // Итог в футере приходит из роута уже посчитанным в базовой валюте и по срезу текущей
  // страницы (бэкенд конвертирует валюты по курсу). Перезапрос при смене страницы/порции
  // меняет query-ключ → итог пересчитывается под видимые строки.
  const summary = items.length > 0 ? data?.summary : undefined

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0, paddingBottom: isDesktop ? 0 : 64 }}>
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("transactions.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("transactions.count_label", { count: total })}
          </Text>
        </Stack>
        <Group gap="xs">
          {/* Hidden until the export API is ready
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            CSV
          </Button>
          */}
          {transactionsBlocked ? (
            // a disabled button swallows hover, so the tooltip listens on the wrapping Box
            <Tooltip label={t("limits.blocked_button_tooltip")} position="bottom-end" withArrow>
              <Box>
                <Button
                  size="sm"
                  leftSection={<IconPlus size={14} />}
                  disabled
                  style={{
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: "var(--mantine-color-default-border)",
                  }}
                >
                  {t("transactions.add")}
                </Button>
              </Box>
            </Tooltip>
          ) : hasNoCategories ? (
            <HoverCard width={240} shadow="md" withArrow position="bottom-end" openDelay={100}>
              <HoverCard.Target>
                {/* muted green (variant light) instead of gray data-disabled —
                    so it does not blend in; it stays a hover target for the tooltip, but
                    we suppress the click and mark aria-disabled */}
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconPlus size={14} />}
                  aria-disabled
                  onClick={(e) => e.preventDefault()}
                  style={{ cursor: "default" }}
                >
                  {t("transactions.add")}
                </Button>
              </HoverCard.Target>

              <HoverCard.Dropdown>
                <Text size="sm">
                  {t("transactions.no_categories")}{" "}
                  <Anchor component={Link} to={RouteNames.Categories}>
                    {t("transactions.add_group_link")}
                  </Anchor>
                </Text>
              </HoverCard.Dropdown>
            </HoverCard>
          ) : (
            <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openAddModal}>
              {t("transactions.add")}
            </Button>
          )}
        </Group>
      </Group>

      <LimitAlert usage={usage?.transactions} kind="transactions" />

      <Paper
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          // Floor for the card so the table never collapses to nothing on a short screen.
          // On a tall screen flex:1 grows past this and the table owns its internal scroll;
          // on a short screen the card holds this height and Main scrolls to reach it.
          // Below `md` the controls move out to the bottom drawer, so the card can sit lower.
          minHeight: isDesktop ? 420 : 320,
        }}
      >
        <TransactionsFilters params={params} setParams={setParams} />

        <TransactionsToolbar
          selectedCount={selectedRecords.length}
          onClearSelection={() => setSelectedRecords([])}
          onBulkDelete={openBulkDelete}
        />

        <TransactionsTable
          transactions={items}
          total={total}
          page={params.page}
          onPageChange={(page) => {
            setSelectedRecords([])
            setParams({ page })
          }}
          recordsPerPage={params.limit}
          onRecordsPerPageChange={(limit) => setParams({ limit, page: 1 })}
          fetching={isLoading || isPlaceholderData}
          isError={isError}
          selectedRecords={selectedRecords}
          onSelectedRecordsChange={setSelectedRecords}
          summary={summary}
          type={params.type}
        />
      </Paper>
    </Stack>
  )
}
