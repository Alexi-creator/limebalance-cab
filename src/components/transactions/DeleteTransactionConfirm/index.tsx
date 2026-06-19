import { deleteTransaction } from "@api/transactions"
import type { Transaction } from "@appTypes/transaction"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { dateFnsLocales } from "@i18n/languages.ts"
import { Button, Group, Paper, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { formatTxAmount } from "../helpers"

interface Props {
  transaction: Transaction
}

/** Transaction deletion confirmation that shows its data. On success refreshes the list and summaries. */
export function DeleteTransactionConfirm({ transaction }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteTransaction(transaction.type, transaction.id),
    onSuccess: () => {
      // transactions list (refetch tops up the page)
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      // category stats and home summaries are stale
      const keys = transaction.type === "expense" ? expenseKeys : incomeKeys
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })
      queryClient.invalidateQueries({ queryKey: [keys.all[0], "summary"] })
      notifications.show({ color: "green", message: t("transactions.delete_success") })
      close()
    },
  })

  return (
    <Stack gap="md">
      <Text size="sm">{t("transactions.delete_confirm")}</Text>

      <Paper withBorder p="sm" bg="var(--mantine-color-default)">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Text size="sm" truncate="end">
            {transaction.description}
          </Text>
          <Text
            ff="monospace"
            size="sm"
            fw={500}
            c={transaction.type === "income" ? "green.5" : undefined}
            style={{ whiteSpace: "nowrap" }}
          >
            {formatTxAmount(transaction, i18n.language)}
          </Text>
        </Group>
        <Text size="xs" c="dimmed" mt={4}>
          {format(transaction.date, "dd MMM yyyy", { locale })}
          {transaction.categoryName ? ` · ${transaction.categoryName}` : ""}
        </Text>
      </Paper>

      <Group justify="flex-end">
        <Button variant="default" onClick={close} disabled={mutation.isPending}>
          {t("common.cancel")}
        </Button>
        <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          {t("common.delete")}
        </Button>
      </Group>
    </Stack>
  )
}
