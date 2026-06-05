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

/** Подтверждение удаления операции с показом её данных. После успеха обновляет список и сводки. */
export function DeleteTransactionConfirm({ transaction }: Props) {
  const { i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteTransaction(transaction.type, transaction.id),
    onSuccess: () => {
      // список операций (рефетч добивает страницу)
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      // статистика категорий устарела — перезапросится при заходе на «Категории»
      const keys = transaction.type === "expense" ? expenseKeys : incomeKeys
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })
      notifications.show({ color: "green", message: "Операция удалена" })
      close()
    },
  })

  return (
    <Stack gap="md">
      <Text size="sm">Удалить операцию? Действие необратимо.</Text>

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
          Отмена
        </Button>
        <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Удалить
        </Button>
      </Group>
    </Stack>
  )
}
