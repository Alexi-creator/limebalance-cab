import { getExpenseCategories } from "@api/expenses"
import { getIncomeCategories } from "@api/incomes"
import { getTransactions } from "@api/transactions"
import type { Transaction } from "@appTypes/transaction"
import { AddModal } from "@components/AddModal"
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
import { Anchor, Button, Group, HoverCard, Paper, Stack, Text, Title } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconDownload, IconPlus } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export function TransactionsPage() {
  const { t } = useTranslation()
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

  // категории нужны, чтобы понять, можно ли вообще добавить операцию
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

  // оба списка загружены и пусты — добавлять операцию некуда
  const hasNoCategories =
    !!expenseCategories &&
    !!incomeCategories &&
    expenseCategories.length === 0 &&
    incomeCategories.length === 0

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
  const summary = data?.summary

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("transactions.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("transactions.count_label", { shown: items.length, count: total })}
          </Text>
        </Stack>
        <Group gap="xs">
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            CSV
          </Button>
          {hasNoCategories ? (
            <HoverCard width={240} shadow="md" withArrow position="bottom-end" openDelay={100}>
              <HoverCard.Target>
                {/* приглушённо-зелёная (variant light) вместо серого data-disabled —
                    чтобы не сливалась; остаётся целью наведения для подсказки, но
                    клик гасим и помечаем aria-disabled */}
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

      <Paper
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
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
          summary={total > 0 ? summary : undefined}
          type={params.type}
        />
      </Paper>
    </Stack>
  )
}
