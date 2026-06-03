import { deleteExpenseCategory } from "@api/expenses"
import { deleteIncomeCategory } from "@api/incomes"
import type { CategoryStats } from "@appTypes/category"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { Alert, Button, Group, Stack, Text } from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

interface Props {
  category: CategoryStats
  isExpense: boolean
}

/** Подтверждение удаления категории. После успеха обновляет список, статистику и операции. */
export function DeleteCategoryConfirm({ category, isExpense }: Props) {
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      isExpense ? deleteExpenseCategory(category.id) : deleteIncomeCategory(category.id),
    onSuccess: () => {
      const keys = isExpense ? expenseKeys : incomeKeys
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })
      queryClient.invalidateQueries({ queryKey: keys.categories })
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      close()
    },
  })

  return (
    <Stack gap="md">
      <Text size="sm">Удалить категорию «{category.name}»? Действие необратимо.</Text>

      {category.count > 0 && (
        <Alert variant="light" color="orange" icon={<IconAlertTriangle size={16} />} radius="md">
          В категории {category.count} операций — удаление может затронуть их.
        </Alert>
      )}

      {mutation.isError && (
        <Alert variant="light" color="red" radius="md">
          Не удалось удалить категорию
        </Alert>
      )}

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
