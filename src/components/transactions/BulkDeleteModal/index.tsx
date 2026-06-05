import { deleteTransactionsBulk } from "@api/transactions"
import type { Transaction } from "@appTypes/transaction"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Alert, Button, Group, ScrollArea, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { formatTxAmount } from "../helpers"

interface Props {
  transactions: Transaction[]
  onSuccess: () => void
}

export function BulkDeleteModal({ transactions, onSuccess }: Props) {
  const { i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const expenseIds = transactions.filter((t) => t.type === "expense").map((t) => t.id)
  const incomeIds = transactions.filter((t) => t.type === "income").map((t) => t.id)

  const mutation = useMutation({
    mutationFn: () =>
      Promise.all([
        ...(expenseIds.length ? [deleteTransactionsBulk("expense", expenseIds)] : []),
        ...(incomeIds.length ? [deleteTransactionsBulk("income", incomeIds)] : []),
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      if (expenseIds.length) {
        queryClient.invalidateQueries({ queryKey: expenseKeys.categoriesStats })
        queryClient.invalidateQueries({ queryKey: [expenseKeys.all[0], "summary"] })
      }
      if (incomeIds.length) {
        queryClient.invalidateQueries({ queryKey: incomeKeys.categoriesStats })
        queryClient.invalidateQueries({ queryKey: [incomeKeys.all[0], "summary"] })
      }
      notifications.show({ color: "green", message: `Удалено ${transactions.length} операций` })
      onSuccess()
      close()
    },
  })

  return (
    <Stack gap="md">
      <Text size="sm">Удалить {transactions.length} операций? Действие необратимо.</Text>

      <ScrollArea.Autosize
        mah={260}
        type="always"
        scrollbarSize={8}
        offsetScrollbars
        style={{
          border: "1px solid var(--mantine-color-default-border)",
          borderRadius: "var(--mantine-radius-md)",
        }}
      >
        <Stack gap={0}>
          {transactions.map((t, i) => (
            <Group
              key={`${t.type}-${t.id}`}
              justify="space-between"
              wrap="nowrap"
              gap="sm"
              px="xs"
              py={6}
              style={{
                borderTop: i === 0 ? undefined : "1px solid var(--mantine-color-default-border)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Text size="sm" truncate="end">
                  {t.description || "—"}
                </Text>
                <Text size="xs" c="dimmed">
                  {format(t.date, "dd MMM yyyy", { locale })}
                  {t.categoryName ? ` · ${t.categoryName}` : ""}
                </Text>
              </div>
              <Text
                ff="monospace"
                size="sm"
                fw={500}
                c={t.type === "income" ? "green.5" : undefined}
                style={{ whiteSpace: "nowrap" }}
              >
                {formatTxAmount(t, i18n.language)}
              </Text>
            </Group>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      <Alert variant="light" color="orange" icon={<IconAlertTriangle size={16} />} radius="md">
        Удалённые операции невозможно восстановить.
      </Alert>

      {mutation.isError && (
        <Alert variant="light" color="red" radius="md">
          Не удалось удалить операции
        </Alert>
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={close} disabled={mutation.isPending}>
          Отмена
        </Button>
        <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Удалить {transactions.length}
        </Button>
      </Group>
    </Stack>
  )
}
