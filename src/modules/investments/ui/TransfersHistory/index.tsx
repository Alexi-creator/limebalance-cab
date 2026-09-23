import { ActionIcon, Badge, Box, Center, Group, Loader, Stack, Text, Tooltip } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconPencil, IconPlugConnected, IconTrash } from "@tabler/icons-react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useTranslation } from "react-i18next"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useModalStore } from "@/shared/store/modalStore"
import { useDeleteTransfer } from "../../api/useDeleteTransfer"
import { useTransfers } from "../../api/useTransfers"
import { formatQty } from "../../lib/format"
import type { Transfer, Venue } from "../../model"
import { ReviewTransferForm } from "../ReviewTransferForm"
import { TransferForm } from "../TransferForm"

interface Props {
  /** Limits the history to one venue; omitted shows everything. */
  venue?: Venue
  /** Only the imported movements still waiting to be answered. */
  pendingOnly?: boolean
}

/**
 * Deposit / withdrawal history, newest first. Rows typed in by hand are editable and removable;
 * rows imported from the exchange are answered instead — what they were — and never deleted, since
 * the money moved whether or not it is on record.
 */
export function TransfersHistory({ venue, pendingOnly }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const open = useModalStore((s) => s.open)

  // Scoped to one venue, or everything — a venue-to-venue move shows up under both sides.
  const { data, isLoading } = useTransfers({
    ...(venue ? { venueId: venue.id } : {}),
    ...(pendingOnly ? { needsReview: true } : {}),
  })

  const mutation = useDeleteTransfer({
    onSuccess: () => notifications.show({ color: "green", message: t("investments.tr_deleted") }),
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const openReview = (row: Transfer) =>
    open({
      centered: true,
      title: t("investments.rv_title"),
      children: <ReviewTransferForm transfer={row} />,
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
        const imported = row.source !== "MANUAL"
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
              <Group gap={6} wrap="nowrap">
                <Text size="sm" truncate="end">
                  {isDeposit ? t("investments.tr_deposit") : t("investments.tr_withdraw")}
                  {" · "}
                  <Text component="span" size="sm" c="dimmed">
                    {row.venueName}
                    {/* Where the money actually came from or went — the peer is the whole
                        difference between a move, a withdrawal and money that is simply gone.
                        An unanswered import has no peer yet, only a question. */}
                    {!row.needsReview && row.peer === "VENUE" && row.peerVenueName
                      ? ` ↔ ${row.peerVenueName}`
                      : ""}
                    {!row.needsReview && row.peer === "EXTERNAL"
                      ? ` → ${t(isDeposit ? "investments.tr_peer_external_in" : "investments.tr_peer_external")}`
                      : ""}
                    {!row.needsReview && row.peer === "LEDGER" && imported && !row.linkedAs
                      ? ` ↔ ${t("investments.tr_peer_ledger")}`
                      : ""}
                    {/* Earned or spent right on the venue: say it as what it is in the reports. */}
                    {row.linkedAs
                      ? ` · ${t(row.linkedAs === "INCOME" ? "investments.rv_linked_income" : "investments.rv_linked_expense")}${
                          row.linkedCategory
                            ? `: ${row.linkedCategory.emoji ? `${row.linkedCategory.emoji} ` : ""}${row.linkedCategory.name}`
                            : ""
                        }`
                      : ""}
                  </Text>
                </Text>
                {row.needsReview && (
                  <Badge
                    size="xs"
                    color="orange"
                    variant="light"
                    style={{ cursor: "pointer", flexShrink: 0 }}
                    onClick={() => openReview(row)}
                  >
                    {t("investments.rv_badge")}
                  </Badge>
                )}
              </Group>
              <Text size="xs" c="dimmed" truncate="end">
                {imported && (
                  <Tooltip label={t("investments.rv_imported_hint")} withinPortal>
                    <IconPlugConnected
                      size={11}
                      style={{ verticalAlign: "-1px", marginRight: 4 }}
                    />
                  </Tooltip>
                )}
                {format(row.date, "d MMM yyyy", { locale })}
                {row.counterparty
                  ? ` · ${t(isDeposit ? "investments.rv_from" : "investments.rv_to", { who: row.counterparty })}`
                  : ""}
                {/* The coin side of a wallet transfer: what was bought or sold for that money. */}
                {row.peer === "LEDGER" && row.asset && row.assetAmount != null
                  ? ` · ${formatQty(row.assetAmount, i18n.language)} ${row.asset}`
                  : ""}
                {row.note ? ` · ${row.note}` : ""}
              </Text>
            </Box>
            <Group gap={4} wrap="nowrap">
              {/* Signed from the venue's point of view, matching the card above it: a deposit
                  adds to what is out there, a withdrawal takes from it. Colouring it would imply
                  good/bad, and neither direction is either — it is the same money either way. */}
              <Text ff="monospace" size="sm" fw={500} style={{ whiteSpace: "nowrap" }}>
                {isDeposit ? "+" : "−"}
                {/* An imported movement is shown in what actually moved on the exchange — the
                    coin — until it is tied to the balance, where the wallet's own money counts. */}
                {imported && row.peer !== "LEDGER" && row.asset && row.assetAmount != null
                  ? `${formatQty(row.assetAmount, i18n.language)} ${row.asset}`
                  : formatCurrency(Math.abs(row.amount), i18n.language, row.currency)}
              </Text>
              <Tooltip label={t("common.edit")} withinPortal>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={t("common.edit")}
                  onClick={() =>
                    imported
                      ? openReview(row)
                      : open({
                          centered: true,
                          title: t("investments.tr_edit_title"),
                          children: <TransferForm transfer={row} />,
                        })
                  }
                >
                  <IconPencil size={14} />
                </ActionIcon>
              </Tooltip>
              {!imported && (
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
              )}
            </Group>
          </Group>
        )
      })}
    </Stack>
  )
}
