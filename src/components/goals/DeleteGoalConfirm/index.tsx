import { deleteGoal } from "@api/goals"
import type { Goal } from "@appTypes/goal"
import { goalKeys } from "@constants/queries/goals"
import { notificationKeys } from "@constants/queries/notifications"
import { transactionKeys } from "@constants/queries/transactions"
import { Button, Group, Paper, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"

interface Props {
  goal: Goal
}

/** Goal deletion confirmation — removes the goal with all contributions and releases the balance. */
export function DeleteGoalConfirm({ goal }: Props) {
  const { t, i18n } = useTranslation()
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteGoal(goal.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
      queryClient.invalidateQueries({ queryKey: transactionKeys.balance })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      notifications.show({ color: "green", message: t("goals.delete_success") })
      close()
    },
  })

  return (
    <Stack gap="md">
      <Text size="sm">{t("goals.delete_confirm")}</Text>

      <Paper withBorder p="sm" bg="var(--mantine-color-default)">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Text size="sm" truncate="end">
            {goal.emoji ? `${goal.emoji} ` : ""}
            {goal.name}
          </Text>
          <Text ff="monospace" size="sm" fw={500} style={{ whiteSpace: "nowrap" }}>
            {formatCurrency(goal.currentAmount, i18n.language, goal.currency)}
          </Text>
        </Group>
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
