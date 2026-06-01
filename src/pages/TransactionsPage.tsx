import { getTransactions } from "@api/transactions"
import { PAGE_LIMIT, transactionsParamsSchema } from "@components/transactions/config"
import { TransactionsFilters } from "@components/transactions/TransactionsFilters"
import { TransactionsTable } from "@components/transactions/TransactionsTable"
import { TRANSACTIONS_STALE_TIME, transactionKeys } from "@constants/queries/transactions"
import { useUrlParams } from "@hooks/useUrlParams"
import { Button, Group, Pagination, Paper, Stack, Text, Title } from "@mantine/core"
import { IconDownload, IconPlus } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

export function TransactionsPage() {
  const [params, setParams] = useUrlParams(transactionsParamsSchema)

  const apiParams = {
    type: params.type,
    categoryId: params.categoryId,
    search: params.search,
    page: params.page,
    limit: PAGE_LIMIT,
  }

  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: transactionKeys.list(apiParams),
    queryFn: () => getTransactions(apiParams),
    placeholderData: keepPreviousData,
    staleTime: TRANSACTIONS_STALE_TIME,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Операции
          </Title>
          <Text size="sm" c="dimmed">
            {total} операций
          </Text>
        </Stack>
        <Group gap="xs">
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            CSV
          </Button>
          <Button size="sm" leftSection={<IconPlus size={14} />}>
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
          isLoading={isLoading}
          isError={isError}
          isPlaceholder={isPlaceholderData}
        />

        {totalPages > 1 && (
          <Group
            justify="center"
            p="md"
            style={{ borderTop: "1px solid var(--mantine-color-default-border)", flexShrink: 0 }}
          >
            <Pagination
              total={totalPages}
              value={params.page}
              onChange={(page) => setParams({ page })}
              size="sm"
            />
          </Group>
        )}
      </Paper>
    </Stack>
  )
}
