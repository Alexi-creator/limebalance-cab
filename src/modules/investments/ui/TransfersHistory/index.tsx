import { ActionIcon, Box, Center, Group, Loader, Stack, Text, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useModalStore } from "@/shared/store/modalStore"
import { useDeleteTransfer } from "../../api/useDeleteTransfer"
import { useTransfers } from "../../api/useTransfers"
import type { Venue } from "../../model"
import { TransferForm } from "../TransferForm"

interface Props {
  /** Limits the history to one venue; omitted shows everything. */
  venue?: Venue
}

/** Deposit / withdrawal history, newest first, each row editable and removable. */
export function TransfersHistory({ venue }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const open = useModalStore((s) => s.open)

  // Scoped to one venue, or everything — a venue-to-venue move shows up under both sides.
  const { data, isLoading } = useTransfers(venue ? { venueId: venue.id } : {})

  const mutation = useDeleteTransfer({
    onSuccess: () => notifications.show({ color: "green", message: t("investments.tr_deleted") }),
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  if (isLoading) {
    return (
      <Center py="lg">
        <Loader size="sm" />
      </Center>
    )
  }

  const rows = data?.items ?? []
  if (rows.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="lg">
        {t("investments.tr_empty")}
      </Text>
    )
  }

  return (
    <Stack gap={0}>
      {rows.map((row) => {
        const isDeposit = row.direction === "IN"
        return (
          <Group
            key={row.id}
            justify="space-between"
            wrap="nowrap"
            gap="sm"
            py={10}
            style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
          >
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" truncate="end">
                {isDeposit ? t("investments.tr_deposit") : t("investments.tr_withdraw")}
                {" · "}
                <Text component="span" size="sm" c="dimmed">
                  {row.venueName}
                  {/* Where the money actually came from or went — the peer is the whole
                      difference between a move, a withdrawal and money that is simply gone. */}
                  {row.peer === "VENUE" && row.peerVenueName ? ` ↔ ${row.peerVenueName}` : ""}
                  {row.peer === "EXTERNAL" ? ` → ${t("investments.tr_peer_external")}` : ""}
                </Text>
              </Text>
              <Text size="xs" c="dimmed" truncate="end">
                {format(row.date, "d MMM yyyy", { locale })}
                {row.note ? ` · ${row.note}` : ""}
              </Text>
            </Box>
            <Group gap={4} wrap="nowrap">
              {/* Signed from the venue's point of view, matching the card above it: a deposit
                  adds to what is out there, a withdrawal takes from it. Colouring it would imply
                  good/bad, and neither direction is either — it is the same money either way. */}
              <Text ff="monospace" size="sm" fw={500} style={{ whiteSpace: "nowrap" }}>
                {isDeposit ? "+" : "−"}
                {formatCurrency(Math.abs(row.amount), i18n.language, row.currency)}
              </Text>
              <Tooltip label={t("common.edit")} withinPortal>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={t("common.edit")}
                  onClick={() =>
                    open({
                      centered: true,
                      title: t("investments.tr_edit_title"),
                      children: <TransferForm transfer={row} />,
                    })
                  }
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("common.delete")} withinPortal>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={t("common.delete")}
                  loading={mutation.isPending && mutation.variables === row.id}
                  onClick={() => mutation.mutate(row.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>
        )
      })}
    </Stack>
  )
}
