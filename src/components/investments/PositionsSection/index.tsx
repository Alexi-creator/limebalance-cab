import { getPositions, type PositionsParams } from "@api/investing"
import {
  type ClosedPosition,
  type ExchangeAccount,
  holdingDays,
  positionDirection,
  unleveragedQty,
} from "@appTypes/investing"
import { DeletePositionConfirm } from "@components/investments/DeletePositionConfirm"
import { EquityCurve } from "@components/investments/EquityCurve"
import { formatPnl, formatQty, formatUsd, pnlColor } from "@components/investments/format"
import { PositionForm } from "@components/investments/PositionForm"
import { investingKeys } from "@constants/queries/investing"
import { dateFnsLocales } from "@i18n/languages.ts"
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useDebouncedValue } from "@mantine/hooks"
import { useModalStore } from "@store/modalStore"
import { IconEdit, IconInfoCircle, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

const PAGE_SIZE_OPTIONS = ["20", "50", "100"]
const DEFAULT_PAGE_SIZE = 20

interface Props {
  accounts: ExchangeAccount[]
}

/** Client-side category filter — the API has no category param yet. */
type CategoryFilter = "all" | "linear" | "spot" | "manual"

const CATEGORY_BADGE: Record<string, { color: string; key: string }> = {
  linear: { color: "blue", key: "investments.cat_linear" },
  spot: { color: "teal", key: "investments.cat_spot" },
  manual: { color: "gray", key: "investments.cat_manual" },
}

/**
 * Trade journal: closed positions synced from the exchange + manual entries.
 * Manual rows are editable; bybit rows aren't (owned by the exchange sync).
 * The KPI row is computed on the client over the loaded page for now — to be
 * replaced with GET /investing/stat once it lands on the backend.
 */
export function PositionsSection({ accounts }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const open = useModalStore((s) => s.open)

  const [symbol, setSymbol] = useState("")
  const [debouncedSymbol] = useDebouncedValue(symbol, 400)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [range, setRange] = useState<[string | null, string | null]>([null, null])
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // Any filter change restarts from the first page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only on filter changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSymbol, accountId, range[0], range[1], category, pageSize])

  const filterParams: PositionsParams = {
    symbol: debouncedSymbol.trim().toUpperCase() || undefined,
    accountId: accountId ?? undefined,
    from: range[0] ? new Date(range[0]) : undefined,
    to: range[1] ? new Date(range[1]) : undefined,
  }
  const params: PositionsParams = {
    ...filterParams,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }

  const { data, isLoading, error } = useQuery({
    queryKey: investingKeys.positions(params),
    queryFn: () => getPositions(params),
    placeholderData: keepPreviousData,
  })

  const allItems = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  // The category filter is client-side over the loaded page (no server param yet).
  const items = category === "all" ? allItems : allItems.filter((p) => p.category === category)

  // KPI over the loaded selection (the current page) — see the note in the component doc.
  const totalPnl = items.reduce((s, p) => s + p.closedPnl, 0)
  const wins = items.filter((p) => p.closedPnl > 0).length
  const winrate = items.length ? Math.round((wins / items.length) * 100) : null
  const tradesCount = category === "all" ? total : items.length

  // What Total PnL actually sums up — the date filter if set, otherwise a page hint, since
  // the KPI is only over the loaded page (not the full filtered result set) until stats move
  // server-side. Without this, "Total PnL" reads as an all-time figure it usually isn't.
  const pnlCaption =
    range[0] && range[1]
      ? `${format(new Date(range[0]), "d MMM", { locale })} – ${format(new Date(range[1]), "d MMM yyyy", { locale })}`
      : range[0]
        ? t("investments.kpi_period_from", {
            date: format(new Date(range[0]), "d MMM yyyy", { locale }),
          })
        : range[1]
          ? t("investments.kpi_period_to", {
              date: format(new Date(range[1]), "d MMM yyyy", { locale }),
            })
          : totalPages > 1
            ? t("investments.kpi_period_page", { page, totalPages })
            : t("investments.kpi_period_all")

  const openCreate = () =>
    open({
      size: "lg",
      centered: true,
      title: t("investments.pos_add_title"),
      children: <PositionForm />,
    })

  const openEdit = (position: ClosedPosition) =>
    open({
      size: "lg",
      centered: true,
      title: t("investments.pos_edit_title"),
      children: <PositionForm position={position} />,
    })

  const openDelete = (position: ClosedPosition) =>
    open({
      centered: true,
      title: t("investments.pos_delete_title"),
      children: <DeletePositionConfirm position={position} />,
    })

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.label }))
  const accountById = new Map(accounts.map((a) => [a.id, a]))

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
        <Kpi
          label={t("investments.kpi_pnl")}
          value={items.length ? formatPnl(totalPnl, i18n.language) : "—"}
          color={items.length ? pnlColor(totalPnl) : undefined}
          caption={pnlCaption}
        />
        <Kpi label={t("investments.kpi_winrate")} value={winrate === null ? "—" : `${winrate}%`} />
        <Kpi label={t("investments.kpi_trades")} value={String(tradesCount)} />
      </SimpleGrid>

      <EquityCurve params={filterParams} category={category} />

      <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
        {t("investments.pos_journal_intro")}
      </Alert>

      <Paper>
        <Group
          justify="space-between"
          p="md"
          wrap="wrap"
          gap="xs"
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
        >
          <Group gap="xs" wrap="wrap">
            <TextInput
              size="xs"
              w={140}
              placeholder="BTCUSDT"
              leftSection={<IconSearch size={14} />}
              value={symbol}
              onChange={(e) => setSymbol(e.currentTarget.value)}
            />
            <DatePickerInput
              size="xs"
              w={220}
              type="range"
              clearable
              placeholder={t("investments.filter_period")}
              value={range}
              onChange={setRange}
              locale={i18n.language}
              valueFormat="DD MMM YYYY"
            />
            {accounts.length > 0 && (
              <Select
                size="xs"
                w={160}
                clearable
                placeholder={t("investments.filter_account")}
                data={accountOptions}
                value={accountId}
                onChange={setAccountId}
              />
            )}
            <SegmentedControl
              size="xs"
              value={category}
              onChange={(v) => setCategory(v as CategoryFilter)}
              data={[
                { value: "all", label: t("common.all") },
                { value: "linear", label: t("investments.cat_linear") },
                { value: "spot", label: t("investments.cat_spot") },
                { value: "manual", label: t("investments.cat_manual") },
              ]}
            />
          </Group>
          <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openCreate}>
            {t("investments.pos_add")}
          </Button>
        </Group>

        {error ? (
          <Alert color="red" m="md">
            {error.message}
          </Alert>
        ) : isLoading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : items.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {t("investments.pos_empty")}
          </Text>
        ) : (
          <Box style={{ overflowX: "auto" }}>
            {/* The table defaults to width:100%, which lets the browser's auto layout squeeze
                columns (badges ellipsize) instead of scrolling. max-content forces it to size to
                its natural content and overflow into the Box's scrollbar instead. */}
            <Table verticalSpacing="sm" highlightOnHover style={{ minWidth: "max-content" }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("investments.col_symbol")}</Table.Th>
                  <Table.Th miw={140} style={{ whiteSpace: "nowrap" }}>
                    {t("investments.col_direction")}
                  </Table.Th>
                  <Table.Th ta="right">{t("investments.col_qty")}</Table.Th>
                  <Table.Th ta="center">{t("investments.col_entry_exit")}</Table.Th>
                  <Table.Th ta="right" miw={130}>
                    {t("investments.col_volume")}
                  </Table.Th>
                  <Table.Th ta="right" miw={110}>
                    {t("investments.col_fee")}
                  </Table.Th>
                  <Table.Th ta="right">{t("investments.col_leverage")}</Table.Th>
                  <Table.Th ta="right">PnL</Table.Th>
                  <Table.Th>{t("investments.col_account")}</Table.Th>
                  <Table.Th>{t("investments.col_opened_at")}</Table.Th>
                  <Table.Th>{t("investments.col_closed_at")}</Table.Th>
                  <Table.Th ta="right">{t("investments.col_days")}</Table.Th>
                  <Table.Th w={90} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((p) => {
                  const long = positionDirection(p) === "long"
                  return (
                    <Table.Tr key={p.id}>
                      <Table.Td>
                        <Text ff="monospace" size="sm" fw={500}>
                          {p.symbol}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} wrap="nowrap">
                          <Badge variant="light" color={long ? "green" : "red"} size="sm">
                            {t(long ? "investments.pos_long" : "investments.pos_short")}
                          </Badge>
                          <CategoryBadge category={p.category} />
                        </Group>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text ff="monospace" size="sm">
                          {formatQty(unleveragedQty(p), i18n.language)}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text ff="monospace" size="sm" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                          {formatUsd(p.avgEntryPrice, i18n.language)} →{" "}
                          {formatUsd(p.avgExitPrice, i18n.language)}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text ff="monospace" size="sm">
                          {formatUsd(p.entryVolumeUsd, i18n.language)}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text
                          ff="monospace"
                          size="sm"
                          c={pnlColor(p.totalFeeUsd == null ? null : -p.totalFeeUsd)}
                        >
                          {/* Fee sign is flipped for display: paying (positive fee) reads as a
                              loss, a rebate (negative fee) reads as a gain — same convention as PnL. */}
                          {p.totalFeeUsd == null ? "—" : formatPnl(-p.totalFeeUsd, i18n.language)}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text ff="monospace" size="sm" c="dimmed">
                          {p.leverage == null ? "—" : `${p.leverage}x`}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text ff="monospace" size="sm" fw={500} c={pnlColor(p.closedPnl)}>
                          {formatPnl(p.closedPnl, i18n.language)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {p.accountId && accountById.get(p.accountId) ? (
                          <Group gap={4} wrap="nowrap">
                            <Text size="sm" truncate="end" maw={140}>
                              {accountById.get(p.accountId)?.label}
                            </Text>
                            <Badge variant="light" color="gray" size="xs" tt="none">
                              {accountById.get(p.accountId)?.exchange}
                            </Badge>
                          </Group>
                        ) : (
                          <Text size="sm" c="dimmed">
                            —
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text
                          ff="monospace"
                          size="sm"
                          c={p.openedAt ? undefined : "dimmed"}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {p.openedAt ? format(p.openedAt, "d MMM yyyy HH:mm", { locale }) : "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text ff="monospace" size="sm" style={{ whiteSpace: "nowrap" }}>
                          {format(p.closedAt, "d MMM yyyy HH:mm", { locale })}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text ff="monospace" size="sm" c="dimmed">
                          {holdingDays(p) === null ? "—" : holdingDays(p)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {p.source === "manual" && (
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            <Tooltip label={t("common.change")}>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                color="gray"
                                aria-label={t("common.change")}
                                onClick={() => openEdit(p)}
                              >
                                <IconEdit size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label={t("common.delete")}>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                color="gray"
                                aria-label={t("common.delete")}
                                onClick={() => openDelete(p)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Box>
        )}

        {total > 0 && (
          <Group justify="space-between" p="md" wrap="wrap" gap="xs">
            <Select
              size="xs"
              w={140}
              label={t("investments.pos_page_size")}
              data={PAGE_SIZE_OPTIONS}
              value={String(pageSize)}
              onChange={(v) => v && setPageSize(Number(v))}
              allowDeselect={false}
              checkIconPosition="right"
              comboboxProps={{ width: 80 }}
            />
            {totalPages > 1 && (
              <Pagination size="sm" total={totalPages} value={page} onChange={setPage} />
            )}
          </Group>
        )}
      </Paper>
    </Stack>
  )
}

/**
 * linear = futures, spot = assembled by the backend from buys/sells (FIFO — a sell
 * closes the oldest buys, the entry price is volume-weighted, hence the tooltip),
 * manual = entered by the user. Unknown future categories fall back to a plain badge.
 */
function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation()
  const badge = CATEGORY_BADGE[category]

  if (!badge) {
    return (
      <Badge variant="light" color="gray" size="sm" tt="none">
        {category}
      </Badge>
    )
  }

  const element = (
    <Badge variant="light" color={badge.color} size="sm">
      {t(badge.key)}
    </Badge>
  )

  if (category !== "spot") return element

  return (
    <Tooltip label={t("investments.spot_fifo_hint")} multiline maw={320}>
      {element}
    </Tooltip>
  )
}

function Kpi({
  label,
  value,
  color,
  caption,
}: {
  label: string
  value: string
  color?: string
  caption?: string
}) {
  return (
    <Paper p="sm">
      <Text
        ff="monospace"
        size="xs"
        c="dimmed"
        tt="uppercase"
        mb={4}
        style={{ letterSpacing: "0.06em" }}
      >
        {label}
      </Text>
      <Text ff="monospace" size="lg" fw={500} c={color}>
        {value}
      </Text>
      {caption && (
        <Text size="xs" c="dimmed">
          {caption}
        </Text>
      )}
    </Paper>
  )
}
