import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { IconAlertTriangle, IconCheck, IconInfoCircle } from "@tabler/icons-react"
import { format, formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import type { TFunction } from "i18next"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { formatCurrency } from "@/shared/lib/formatCurrency"
import { useModalStore } from "@/shared/store/modalStore"
import { P2P_PAGE_SIZE, useP2pOrders } from "../../api/useP2pOrders"
import { useSetP2pAutoRecord } from "../../api/useSetP2pAutoRecord"
import { formatQty } from "../../lib/format"
import type { ExchangeAccount, P2pOrder } from "../../model"
import { p2pUnavailableOf } from "../../model"
import { CoinIcon } from "../CoinIcon"
import { TransferForm } from "../TransferForm"

interface Props {
  accounts: ExchangeAccount[]
}

const STATUS_COLOR: Record<P2pOrder["status"], string> = {
  DONE: "green",
  ACTIVE: "blue",
  DISPUTE: "orange",
  CANCELLED: "gray",
}

// The "all accounts" choice of the picker; a real account id otherwise.
const ALL = "all"

/** Bybit's code for "this key may not do that" — the one refusal the user can fix themselves. */
const PERMISSION_DENIED = 10005

/**
 * P2P orders, saved on our side and kept for good — Bybit's own API only reaches 180 days back, so
 * the table starts there and grows from then on.
 *
 * Mostly a record to look things up in — but also the missing half of the deposit import: coins
 * bought on P2P land on the exchange with no deposit record, so nothing else can tell that they
 * were paid for with the user's own money. Recording a completed order as a transfer from the
 * balance is what keeps them from reading as trading profit.
 */
export function P2pSection({ accounts }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const theme = useMantineTheme()
  const isTableView = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true, {
    getInitialValueInEffect: false,
  })
  const open = useModalStore((s) => s.open)

  const bybitAccounts = accounts.filter((a) => a.exchange === "bybit")
  const [picked, setPicked] = useState<string>(ALL)
  const accountId = picked === ALL ? null : picked
  const [page, setPage] = useState(1)

  const { data, isLoading, isFetching, error } = useP2pOrders(accountId, page)
  // Auto-recording is a setting of one account, so it is offered when one account is in view.
  const settingsAccount =
    bybitAccounts.find((a) => a.id === accountId) ??
    (bybitAccounts.length === 1 ? bybitAccounts[0] : undefined)
  const autoRecord = useSetP2pAutoRecord({
    onSuccess: (enabled) =>
      notifications.show({
        color: "green",
        message: t(enabled ? "investments.p2p_auto_on" : "investments.p2p_auto_off"),
      }),
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })
  // Nothing saved and Bybit refused: the reason is all there is to show. With history saved, the
  // same refusal only means the table may be behind (data.syncError below).
  const unavailable = p2pUnavailableOf(error)

  const record = (order: P2pOrder) => {
    if (!order.venueId) return
    const buy = order.side === "BUY"
    open({
      centered: true,
      title: t(buy ? "investments.tr_deposit_title" : "investments.tr_withdraw_title"),
      children: (
        <TransferForm
          preset={{
            mode: buy ? "deposit" : "withdraw",
            venueId: order.venueId,
            amount: order.fiatAmount,
            currency: order.fiatCurrency,
            date: order.createdAt,
            note: t(buy ? "investments.p2p_note_buy" : "investments.p2p_note_sell", {
              qty: formatQty(order.quantity, i18n.language),
              asset: order.asset,
              price: order.price,
            }),
            p2pOrderId: order.id,
          }}
        />
      ),
    })
  }

  // Saved history outlives a disconnected account, so "no account" is only the empty state when
  // there is also nothing saved to show.
  if (bybitAccounts.length === 0 && !isLoading && (data?.total ?? 0) === 0) {
    return (
      <Paper p="xl">
        <Text size="sm" c="dimmed" ta="center">
          {t("investments.p2p_no_account")}
        </Text>
      </Paper>
    )
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / P2P_PAGE_SIZE))
  const items = data?.items ?? []

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <Stack gap={4} maw={640}>
          <Text size="sm" c="dimmed">
            {t("investments.p2p_hint")}
          </Text>
          <Text size="xs" c="dimmed">
            {t("investments.p2p_limit_note")}
            {data?.syncedAt
              ? ` · ${t("investments.p2p_synced_ago", {
                  ago: formatDistanceToNow(data.syncedAt, { addSuffix: true, locale }),
                })}`
              : ""}
          </Text>
        </Stack>
        {bybitAccounts.length > 1 && (
          <Select
            size="xs"
            w={220}
            value={picked}
            onChange={(v) => {
              setPicked(v ?? ALL)
              setPage(1)
            }}
            allowDeselect={false}
            data={[
              { value: ALL, label: t("investments.p2p_all_accounts") },
              ...bybitAccounts.map((a) => ({ value: a.id, label: a.label || a.exchange })),
            ]}
          />
        )}
      </Group>

      {settingsAccount ? (
        <Paper p="sm" withBorder>
          <Switch
            checked={!!settingsAccount.p2pAutoRecordFrom}
            disabled={autoRecord.isPending}
            onChange={(e) =>
              autoRecord.mutate({
                accountId: settingsAccount.id,
                enabled: e.currentTarget.checked,
              })
            }
            label={t("investments.p2p_auto_label")}
            description={
              settingsAccount.p2pAutoRecordFrom
                ? t("investments.p2p_auto_since", {
                    date: format(settingsAccount.p2pAutoRecordFrom, "d MMM yyyy, HH:mm", {
                      locale,
                    }),
                  })
                : t("investments.p2p_auto_hint")
            }
          />
        </Paper>
      ) : (
        bybitAccounts.length > 1 && (
          <Text size="xs" c="dimmed">
            {t("investments.p2p_auto_pick_account")}
          </Text>
        )
      )}

      {data?.syncError && (data.total ?? 0) > 0 && (
        <Alert color="orange" variant="light" icon={<IconAlertTriangle size={18} />} p="sm">
          <Text size="sm">{t("investments.p2p_sync_failed")}</Text>
          <Text size="xs" c="dimmed" mt={2}>
            Bybit {data.syncError.retCode}: {data.syncError.message}
          </Text>
        </Alert>
      )}

      <Paper p={isTableView ? "md" : "sm"} pos="relative">
        {isLoading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : unavailable ? (
          <Alert color="orange" variant="light" icon={<IconInfoCircle size={18} />}>
            {/* Only Bybit's permission refusal is worth sending the user to the key settings;
                anything else (a bad window, maintenance) would send them on a wrong errand. */}
            <Text size="sm">
              {t(
                unavailable.retCode === PERMISSION_DENIED
                  ? "investments.p2p_unavailable"
                  : "investments.p2p_read_failed",
              )}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Bybit {unavailable.retCode}: {unavailable.message}
            </Text>
          </Alert>
        ) : error ? (
          <Alert color="red">{error.message}</Alert>
        ) : items.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {t("investments.p2p_empty")}
          </Text>
        ) : isTableView ? (
          <Box style={{ overflowX: "auto", opacity: isFetching ? 0.6 : 1 }}>
            <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: "max-content" }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("investments.p2p_col_date")}</Table.Th>
                  <Table.Th>{t("investments.p2p_col_side")}</Table.Th>
                  <Table.Th ta="right">{t("investments.p2p_col_coin")}</Table.Th>
                  <Table.Th ta="right">{t("investments.p2p_col_fiat")}</Table.Th>
                  <Table.Th ta="right">{t("investments.p2p_col_price")}</Table.Th>
                  <Table.Th>{t("investments.p2p_col_counterparty")}</Table.Th>
                  <Table.Th>{t("investments.p2p_col_status")}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((o) => (
                  <Table.Tr key={o.id}>
                    <Table.Td style={{ whiteSpace: "nowrap" }}>
                      {format(o.createdAt, "d MMM yyyy, HH:mm", { locale })}
                    </Table.Td>
                    <Table.Td>
                      <SideBadge order={o} t={t} />
                    </Table.Td>
                    <Table.Td ta="right">
                      <Group gap={6} justify="flex-end" wrap="nowrap">
                        <CoinIcon ticker={o.asset} size={18} />
                        <Text size="sm" ff="monospace">
                          {formatQty(o.quantity, i18n.language)} {o.asset}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td ta="right" ff="monospace" style={{ whiteSpace: "nowrap" }}>
                      {formatCurrency(o.fiatAmount, i18n.language, o.fiatCurrency)}
                    </Table.Td>
                    <Table.Td ta="right" ff="monospace">
                      {o.price}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" truncate="end" maw={180}>
                        {o.counterparty ?? "—"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge order={o} t={t} />
                    </Table.Td>
                    <Table.Td>
                      <RecordAction order={o} t={t} canRecord={!!o.venueId} onRecord={record} />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        ) : (
          <Stack gap={0} style={{ opacity: isFetching ? 0.6 : 1 }}>
            {items.map((o) => (
              <Stack
                key={o.id}
                gap={4}
                py={10}
                style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
              >
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Group gap={6} wrap="nowrap">
                    <SideBadge order={o} t={t} />
                    <Text size="sm" ff="monospace">
                      {formatQty(o.quantity, i18n.language)} {o.asset}
                    </Text>
                  </Group>
                  <Text size="sm" ff="monospace" fw={500} style={{ whiteSpace: "nowrap" }}>
                    {formatCurrency(o.fiatAmount, i18n.language, o.fiatCurrency)}
                  </Text>
                </Group>
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Text size="xs" c="dimmed" truncate="end">
                    {format(o.createdAt, "d MMM, HH:mm", { locale })} · {o.price}
                    {o.counterparty ? ` · ${o.counterparty}` : ""}
                  </Text>
                  <Group gap={6} wrap="nowrap">
                    {o.status !== "DONE" && <StatusBadge order={o} t={t} />}
                    <RecordAction order={o} t={t} canRecord={!!o.venueId} onRecord={record} />
                  </Group>
                </Group>
              </Stack>
            ))}
          </Stack>
        )}

        {totalPages > 1 && !unavailable && (
          <Group justify="center" mt="md">
            <Pagination
              size="sm"
              siblings={isTableView ? 1 : 0}
              boundaries={isTableView ? 1 : 0}
              total={totalPages}
              value={page}
              onChange={setPage}
            />
          </Group>
        )}
      </Paper>
    </Stack>
  )
}

function SideBadge({ order, t }: { order: P2pOrder; t: TFunction }) {
  // Neutral colours on purpose: buying and selling are neither good nor bad.
  return (
    <Badge size="sm" variant="light" color={order.side === "BUY" ? "blue" : "grape"}>
      {t(order.side === "BUY" ? "investments.p2p_buy" : "investments.p2p_sell")}
    </Badge>
  )
}

function StatusBadge({ order, t }: { order: P2pOrder; t: TFunction }) {
  return (
    <Badge size="sm" variant="dot" color={STATUS_COLOR[order.status]}>
      {t(`investments.p2p_status_${order.status.toLowerCase()}`)}
    </Badge>
  )
}

/**
 * Only a completed order moved money, so only it can be recorded — and only once. The recorded
 * state comes from the backend, which ties the transfer to the order id.
 */
function RecordAction({
  order,
  t,
  canRecord,
  onRecord,
}: {
  order: P2pOrder
  t: TFunction
  canRecord: boolean
  onRecord: (order: P2pOrder) => void
}) {
  if (order.transferId) {
    return (
      <Badge size="sm" variant="light" color="gray" leftSection={<IconCheck size={10} />}>
        {t(order.autoRecorded ? "investments.p2p_auto_recorded" : "investments.p2p_recorded")}
      </Badge>
    )
  }
  if (order.status !== "DONE") return null
  return (
    <Button size="compact-xs" variant="light" disabled={!canRecord} onClick={() => onRecord(order)}>
      {t("investments.p2p_record")}
    </Button>
  )
}
