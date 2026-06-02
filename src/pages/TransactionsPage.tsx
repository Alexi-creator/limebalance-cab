import { getTransactions } from "@api/transactions"
import { AddModal } from "@components/AddModal"
import { transactionsParamsSchema } from "@components/transactions/config"
import { TransactionsFilters } from "@components/transactions/TransactionsFilters"
import { TransactionsTable } from "@components/transactions/TransactionsTable"
import { TRANSACTIONS_STALE_TIME, transactionKeys } from "@constants/queries/transactions"
import { useUrlParams } from "@hooks/useUrlParams"
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconDownload, IconPlus } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

export function TransactionsPage() {
  const [params, setParams] = useUrlParams(transactionsParamsSchema)
  const openModal = useModalStore((s) => s.open)

  const apiParams = {
    type: params.type,
    categoryId: params.categoryId,
    search: params.search,
    page: params.page,
    limit: params.limit,
  }

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: transactionKeys.list(apiParams),
    queryFn: () => getTransactions(apiParams),
    placeholderData: keepPreviousData,
    staleTime: TRANSACTIONS_STALE_TIME,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Операции
          </Title>
          <Text size="sm" c="dimmed">
            {items.length} / {total} операций
          </Text>
        </Stack>
        <Group gap="xs">
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            CSV
          </Button>
          <Button
            size="sm"
            leftSection={<IconPlus size={14} />}
            onClick={() =>
              openModal({
                size: "lg",
                centered: true,
                children: <AddModal type="transaction" lockType />,
              })
            }
          >
            Добавить операцию
          </Button>
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

        <TransactionsTable
          transactions={items}
          total={total}
          page={params.page}
          onPageChange={(page) => setParams({ page })}
          recordsPerPage={params.limit}
          onRecordsPerPageChange={(limit) => setParams({ limit, page: 1 })}
          fetching={isLoading || isPlaceholderData}
          isError={isError}
        />
      </Paper>
    </Stack>
  )
}
