import { deleteContribution, getContributions } from "@api/goals"
import type { Goal } from "@appTypes/goal"
import { GOALS_STALE_TIME, goalKeys } from "@constants/queries/goals"
import { notificationKeys } from "@constants/queries/notifications"
import { transactionKeys } from "@constants/queries/transactions"
import { dateFnsLocales } from "@i18n/languages.ts"
import { ActionIcon, Group, Loader, Paper, ScrollArea, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"

interface Props {
  goal: Goal
}

/** Contribution history for a goal with per-item deletion. Deleting refetches the goal and balance. */
export function ContributionsHistory({ goal }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: goalKeys.contributions(goal.id),
    queryFn: () => getContributions(goal.id),
    staleTime: GOALS_STALE_TIME,
  })

  const remove = useMutation({
    mutationFn: (contributionId: string) => deleteContribution(goal.id, contributionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.contributions(goal.id) })
      queryClient.invalidateQueries({ queryKey: goalKeys.all })
      queryClient.invalidateQueries({ queryKey: transactionKeys.balance })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      notifications.show({ color: "green", message: t("goals.contribution_deleted") })
    },
  })

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader size="sm" />
      </Group>
    )
  }

  const items = data ?? []

  if (items.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" py="xl">
        {t("goals.history_empty")}
      </Text>
    )
  }

  return (
    <ScrollArea.Autosize mah={400}>
      <Stack gap="xs">
        {items.map((c) => {
          const negative = c.amount < 0
          return (
            <Paper key={c.id} withBorder p="sm" bg="var(--mantine-color-default)">
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text size="xs" c="dimmed">
                    {format(c.date, "dd MMM yyyy", { locale })}
                  </Text>
                  {c.note && (
                    <Text size="sm" truncate="end">
                      {c.note}
                    </Text>
                  )}
                </Stack>
                <Group gap="xs" wrap="nowrap">
                  <Text
                    ff="monospace"
                    size="sm"
                    fw={500}
                    c={negative ? "red.5" : "green.5"}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {negative ? "−" : "+"}
                    {formatCurrency(Math.abs(c.amount), i18n.language, goal.currency)}
                  </Text>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={t("common.delete")}
                    loading={remove.isPending && remove.variables === c.id}
                    onClick={() => remove.mutate(c.id)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          )
        })}
      </Stack>
    </ScrollArea.Autosize>
  )
}
