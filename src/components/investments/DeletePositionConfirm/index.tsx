import { deleteManualPosition } from "@api/investing"
import { type Position, positionDirection } from "@appTypes/investing"
import { investingKeys } from "@constants/queries/investing"
import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

interface Props {
  /** Only source=manual — the backend rejects deleting exchange positions. */
  position: Position
}

export function DeletePositionConfirm({ position }: Props) {
  const { t } = useTranslation()
  const close = useModalStore((s) => s.close)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteManualPosition(position.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investingKeys.allPositions })
      notifications.show({ color: "green", message: t("investments.pos_delete_success") })
      close()
    },
    onError: (err) => {
      notifications.show({ color: "red", message: err.message })
    },
  })

  const long = positionDirection(position) === "long"

  return (
    <Stack gap="md">
      <Text size="sm">{t("investments.pos_delete_confirm")}</Text>

      <Paper withBorder p="sm" bg="var(--mantine-color-default)">
        <Group gap="sm" wrap="nowrap">
          <Text ff="monospace" size="sm" fw={500}>
            {position.symbol}
          </Text>
          <Badge variant="light" color={long ? "green" : "red"} size="sm">
            {t(long ? "investments.pos_long" : "investments.pos_short")}
          </Badge>
          <Text ff="monospace" size="sm" c="dimmed">
            {position.avgEntryPrice} →{" "}
            {position.avgExitPrice == null ? t("investments.pos_in_trade") : position.avgExitPrice}
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
