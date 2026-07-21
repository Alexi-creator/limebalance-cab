import { deleteHolding } from "@api/investing"
import type { Holding } from "@appTypes/investing"
import { formatQty } from "@components/investments/format"
import { investingKeys } from "@constants/queries/investing"
import { Button, Group, Paper, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

interface Props {
  holding: Holding
}

export function DeleteHoldingConfirm({ holding }: Props) {
  const { t, i18n } = useTranslation()
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteHolding(holding.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investingKeys.holdings })
      notifications.show({ color: "green", message: t("investments.hold_delete_success") })
      close()
    },
    onError: (err) => {
      notifications.show({ color: "red", message: err.message })
    },
  })

  return (
    <Stack gap="md">
      <Text size="sm">{t("investments.hold_delete_confirm")}</Text>

      <Paper withBorder p="sm" bg="var(--mantine-color-default)">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Text ff="monospace" size="sm" fw={500}>
            {holding.asset}
          </Text>
          <Text ff="monospace" size="sm" c="dimmed">
            {formatQty(holding.amount, i18n.language)}
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
