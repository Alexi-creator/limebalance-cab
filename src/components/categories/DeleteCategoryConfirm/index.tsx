import { deleteExpenseCategory } from "@api/expenses"
import { deleteIncomeCategory } from "@api/incomes"
import type { CategoryStats } from "@appTypes/category"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { transactionKeys } from "@constants/queries/transactions"
import { Alert, Button, Group, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

interface Props {
  category: CategoryStats
  isExpense: boolean
}

/** Category deletion confirmation. On success refreshes the list, stats, and transactions. */
export function DeleteCategoryConfirm({ category, isExpense }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () =>
      isExpense ? deleteExpenseCategory(category.id) : deleteIncomeCategory(category.id),
    onSuccess: () => {
      const keys = isExpense ? expenseKeys : incomeKeys
      queryClient.invalidateQueries({ queryKey: keys.categoriesStats })
      queryClient.invalidateQueries({ queryKey: keys.categories, exact: true })
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      notifications.show({ color: "green", message: t("categories.delete_success") })
      close()
    },
  })

  return (
    <Stack gap="md">
      <Text size="sm">{t("categories.delete_confirm", { name: category.name })}</Text>

      {category.count > 0 && (
        <Alert variant="light" color="red" icon={<IconAlertTriangle size={16} />} radius="md">
          {t("categories.delete_warning", { count: category.count })}
        </Alert>
      )}

      {mutation.isError && (
        <Alert variant="light" color="red" radius="md">
          {t("categories.delete_error")}
        </Alert>
      )}

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
