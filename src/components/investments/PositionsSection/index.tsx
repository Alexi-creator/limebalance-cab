import {
  getEquityCurve,
  getPositions,
  getPositionsSummary,
  type PositionsParams,
  syncExchangeAccount,
} from "@api/investing"
import {
  type ExchangeAccount,
  holdingDays,
  type Position,
  positionDirection,
  positionPnl,
  positionRoi,
  unleveragedQty,
} from "@appTypes/investing"
import { CategoryBadge } from "@components/investments/CategoryBadge"
import { DeletePositionConfirm } from "@components/investments/DeletePositionConfirm"
import { EquityCurve } from "@components/investments/EquityCurve"
import {
  formatPct,
  formatPnl,
  formatQty,
  formatUsd,
  pnlColor,
} from "@components/investments/format"
import { PositionForm } from "@components/investments/PositionForm"
import { PositionNotes } from "@components/investments/PositionNotes"
import {
  POSITIONS_PAGE_SIZE_OPTIONS,
  positionsParamsSchema,
} from "@components/investments/PositionsSection/config"
import { MobileFilterSheet } from "@components/MobileFilterSheet"
import { StickyScrollbarX } from "@components/StickyScrollbarX"
import { investingKeys } from "@constants/queries/investing"
import { useUrlParams } from "@hooks/useUrlParams"
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
  useMantineTheme,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
import { useModalStore } from "@store/modalStore"
import {
  IconBolt,
  IconEdit,
  IconNotes,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  accounts: ExchangeAccount[]
}

/** "all" means the param is omitted — every other value is a real `category` filter on the API. */
type CategoryFilter = "all" | "linear" | "spot" | "manual"

/**
 * Trade journal: closed positions synced from the exchange + manual entries.
 * Manual rows are editable; bybit rows aren't (owned by the exchange sync).
 * The KPI row (PnL/winrate/trades) comes entirely from GET /investing/positions/summary —
 * aggregated server-side over the whole filtered history, not just the visible page.
 */
export function PositionsSection({ accounts }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const open = useModalStore((s) => s.open)
  const queryClient = useQueryClient()
  const theme = useMantineTheme()
  // Below `md` the filter controls don't fit in a row — they move into a bottom drawer,
  // same pattern as the transactions table (see MobileFilterSheet).
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`, true, {
    getInitialValueInEffect: false,
  })
  // Callback ref (state, not useRef): the table wrapper mounts conditionally (behind the
  // loading state), and StickyScrollbarX needs its effect to re-run once that actually
  // happens — a plain ref object doesn't change identity when `.current` changes later.
  const [tableScrollEl, setTableScrollEl] = useState<HTMLDivElement | null>(null)

  // Filters/pagination live in the URL (like the transactions table) so a reload or a shared
  // link keeps the same view — see PositionsSection/config.ts.
  const [urlParams, setParams] = useUrlParams(positionsParamsSchema)

  const [symbolInput, setSymbolInput] = useState(urlParams.symbol ?? "")
  const [debouncedSymbol] = useDebouncedValue(symbolInput, 400)

  // debounced search → URL; comparison against urlParams.symbol is required: setParams'
  // identity changes on every URL update, and without this check the effect would re-run
  // on page change and reset it back to 1 — same guard as TransactionsFilters' search.
  useEffect(() => {
    const next = debouncedSymbol.trim().toUpperCase() || undefined
    if (next === urlParams.symbol) return
    setParams({ symbol: next, page: 1 })
  }, [debouncedSymbol, urlParams.symbol, setParams])

  const range: [string | null, string | null] = [urlParams.from ?? null, urlParams.to ?? null]

  const filterParams: PositionsParams = {
    symbol: urlParams.symbol,
    accountId: urlParams.accountId,
    from: urlParams.from ? new Date(urlParams.from) : undefined,
    to: urlParams.to ? new Date(urlParams.to) : undefined,
    status: urlParams.status === "all" ? undefined : urlParams.status,
    category: urlParams.category === "all" ? undefined : urlParams.category,
  }
  const params: PositionsParams = {
    ...filterParams,
    limit: urlParams.limit,
    offset: (urlParams.page - 1) * urlParams.limit,
  }

  const { data, isLoading, error } = useQuery({
    queryKey: investingKeys.positions(params),
    queryFn: () => getPositions(params),
    placeholderData: keepPreviousData,
  })
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / urlParams.limit)
  const items = data?.items ?? []

  // `lastSyncAt` stays null until an account's first sync finishes (see AccountsSection) —
  // reuse that signal here so a freshly connected account shows "syncing" instead of the
  // plain empty state right after the tab switches to the journal.
  const firstSyncPending = accounts.some((a) => a.lastSyncAt === null)

  // Top KPI row — over the whole current filter selection (symbol/account/period/category),
  // not just the visible page. Aggregated server-side, no page cap.
  const { data: summaryData } = useQuery({
    queryKey: investingKeys.positionsSummary(filterParams),
    queryFn: () => getPositionsSummary(filterParams),
    placeholderData: keepPreviousData,
  })
  const closedCount = summaryData?.closedCount ?? 0
  const totalPnl = summaryData?.totalPnl ?? 0
  const tradesCount = total
  const winrate = closedCount
    ? Math.round(((summaryData?.winCount ?? 0) / closedCount) * 100)
    : null

  // Same allowlist EquityCurve builds for itself (symbol/account/category, no date range/status —
  // the endpoint always covers full closed history) — an identical params object means React
  // Query dedupes this against the curve's own request instead of firing a second one. Only
  // used for its earliest entry, to caption the "all time" KPI with the actual start date.
  const chartParams: PositionsParams = {
    symbol: filterParams.symbol,
    accountId: filterParams.accountId,
    category: filterParams.category,
  }
  const { data: equityData } = useQuery({
    queryKey: investingKeys.equityCurve(chartParams),
    queryFn: () => getEquityCurve(chartParams),
  })
  const earliestClosedAt = equityData?.items[0]?.closedAt

  // Page summary (bottom row, next to pagination) — over just the rows shown on this page,
  // same idea as the transactions table's footer. Open trades have no closedPnl yet, so
  // they're excluded from the PnL/winrate math (they still count toward "trades" below).
  const pageClosedItems = items.filter((p) => p.status === "CLOSED")
  const pageTotalPnl = pageClosedItems.reduce((s, p) => s + (p.closedPnl ?? 0), 0)
  const pageWins = pageClosedItems.filter((p) => (p.closedPnl ?? 0) > 0).length
  const pageWinrate = pageClosedItems.length
    ? Math.round((pageWins / pageClosedItems.length) * 100)
    : null

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
          : earliestClosedAt
            ? t("investments.kpi_period_all_since", {
                date: format(earliestClosedAt, "d MMM yyyy", { locale }),
              })
            : t("investments.kpi_period_all")

  const openCreate = () =>
    open({
      size: "lg",
      centered: true,
      title: t("investments.pos_add_title"),
      children: <PositionForm />,
    })

  const openEdit = (position: Position) =>
    open({
      size: "lg",
      centered: true,
      title: t("investments.pos_edit_title"),
      children: <PositionForm position={position} />,
    })

  const openDelete = (position: Position) =>
    open({
      centered: true,
      title: t("investments.pos_delete_title"),
      children: <DeletePositionConfirm position={position} />,
    })

  // Available on every position — bybit or manual, open or closed — unlike edit/delete.
  const openNotes = (position: Position) =>
    open({
      size: "lg",
      centered: true,
      title: t("investments.note_title", { symbol: position.symbol }),
      children: <PositionNotes position={position} />,
    })

  // Manual re-sync from the journal itself — the filtered account if one is selected,
  // otherwise every connected account. Same call as the "Sync now" button on the
  // Exchange accounts tab; invalidating "investing" also refreshes the table below.
  const syncMutation = useMutation({
    mutationFn: async () => {
      const targets = urlParams.accountId
        ? accounts.filter((a) => a.id === urlParams.accountId)
        : accounts
      await Promise.all(targets.map((a) => syncExchangeAccount(a.id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investingKeys.all })
      notifications.show({ color: "green", message: t("investments.acc_sync_success") })
    },
    onError: (err) => {
      // Same reasoning as AccountsSection's sync mutation: a failed manual sync still persists
      // lastError/status on the account, so refetch to pick it up (also surfaces any accounts
      // that did sync before the one that failed, when re-syncing all of them at once).
      queryClient.invalidateQueries({ queryKey: investingKeys.all })
      notifications.show({ color: "red", message: err.message })
    },
  })

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.label }))
  const accountById = new Map(accounts.map((a) => [a.id, a]))

  // count of active filters — shown on the mobile drawer's handle
  const activeFilterCount =
    (debouncedSymbol ? 1 : 0) +
    (range[0] || range[1] ? 1 : 0) +
    (urlParams.accountId ? 1 : 0) +
    (urlParams.category !== "all" ? 1 : 0) +
    (urlParams.status !== "all" ? 1 : 0)

  // Back to the schema defaults — status included, so this also restores the default
  // "Closed" view rather than clearing it to "All".
  const resetFilters = () => {
    setSymbolInput("")
    setParams({
      symbol: undefined,
      accountId: undefined,
      from: undefined,
      to: undefined,
      status: undefined,
      category: "all",
      page: 1,
    })
  }

  // `vertical` stacks the controls full-width for the drawer; the row layout keeps the fixed
  // widths used on desktop. Same split as TransactionsFilters' `controls(vertical)`.
  const filterControls = (vertical: boolean) => (
    <>
      <TextInput
        size={vertical ? "sm" : "xs"}
        label={t("investments.col_symbol")}
        w={vertical ? "100%" : 140}
        placeholder="BTCUSDT"
        leftSection={<IconSearch size={14} />}
        value={symbolInput}
        onChange={(e) => setSymbolInput(e.currentTarget.value)}
      />
      <DatePickerInput
        size={vertical ? "sm" : "xs"}
        w={vertical ? "100%" : 220}
        type="range"
        label={t("investments.filter_period")}
        clearable
        placeholder={t("investments.filter_period")}
        value={range}
        onChange={([from, to]) =>
          setParams({ from: from ?? undefined, to: to ?? undefined, page: 1 })
        }
        locale={i18n.language}
        valueFormat="DD MMM YYYY"
      />
      {accounts.length > 0 && (
        <Select
          size={vertical ? "sm" : "xs"}
          w={vertical ? "100%" : 160}
          label={t("investments.filter_account")}
          clearable
          placeholder={t("investments.filter_account")}
          data={accountOptions}
          value={urlParams.accountId ?? null}
          onChange={(v) => setParams({ accountId: v ?? undefined, page: 1 })}
        />
      )}
      <Select
        size={vertical ? "sm" : "xs"}
        w={vertical ? "100%" : 140}
        label={t("investments.filter_status")}
        placeholder={t("investments.filter_status")}
        allowDeselect={false}
        data={[
          { value: "all", label: t("common.all") },
          { value: "OPEN", label: t("investments.pos_status_open") },
          { value: "CLOSED", label: t("investments.pos_status_closed") },
        ]}
        value={urlParams.status}
        onChange={(v) => v && setParams({ status: v as "all" | "OPEN" | "CLOSED", page: 1 })}
      />
      <SegmentedControl
        size={vertical ? "sm" : "xs"}
        fullWidth={vertical}
        value={urlParams.category}
        onChange={(v) => setParams({ category: v as CategoryFilter, page: 1 })}
        data={[
          { value: "all", label: t("common.all") },
          { value: "linear", label: t("investments.cat_linear") },
          { value: "spot", label: t("investments.cat_spot") },
          { value: "manual", label: t("investments.cat_manual") },
        ]}
      />
      {/* On the mobile sheet the reset lives in its header instead (next to close) — inline here
          it would be a lone unlabeled icon at the end of a vertical field list. */}
      {!vertical && (
        <Tooltip label={t("common.reset")}>
          <ActionIcon
            variant="light"
            color="red"
            size="lg"
            aria-label={t("common.reset")}
            onClick={resetFilters}
          >
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      )}
    </>
  )

  const pnlValue = closedCount ? formatPnl(totalPnl, i18n.language) : "—"
  const pnlKpiColor = closedCount ? pnlColor(totalPnl) : undefined

  return (
    // Below `md`, the filter drawer's handle is fixed to the viewport edge — reserve space
    // so it never covers the table footer/pagination (same as the transactions page).
    <Stack gap="md" style={{ paddingBottom: isDesktop ? 0 : 64 }}>
      {/* >=768px (Mantine's sm breakpoint): three separate cards. Below that, one combined
          card (KpiCompact) — three full-width tiles stacked would eat too much vertical space
          on a phone. */}
      <SimpleGrid cols={3} spacing="xs" visibleFrom="sm">
        <Kpi
          label={t("investments.kpi_pnl")}
          value={pnlValue}
          color={pnlKpiColor}
          caption={pnlCaption}
        />
        <Kpi label={t("investments.kpi_winrate")} value={winrate === null ? "—" : `${winrate}%`} />
        <Kpi label={t("investments.kpi_trades")} value={String(tradesCount)} />
      </SimpleGrid>
      <KpiCompact
        pnlLabel={t("investments.kpi_pnl")}
        pnlValue={pnlValue}
        pnlValueColor={pnlKpiColor}
        winrateLabel={t("investments.kpi_winrate")}
        winrateValue={winrate === null ? "—" : `${winrate}%`}
        tradesLabel={t("investments.kpi_trades")}
        tradesValue={String(tradesCount)}
        caption={pnlCaption}
      />

      <EquityCurve params={filterParams} />

      <Paper>
        <Group
          data-tour="inv-journal-filters"
          justify="space-between"
          p="md"
          wrap="wrap"
          gap="xs"
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
        >
          {isDesktop ? (
            <Group gap="xs" wrap="wrap">
              {filterControls(false)}
            </Group>
          ) : (
            // Filters live in the bottom drawer below `md` — only the primary action stays here.
            <span />
          )}
          <Group gap="xs" wrap="nowrap">
            {accounts.length > 0 && (
              <Tooltip label={t("investments.acc_sync_now")}>
                <ActionIcon
                  variant="default"
                  size="lg"
                  aria-label={t("investments.acc_sync_now")}
                  loading={syncMutation.isPending}
                  onClick={() => syncMutation.mutate()}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openCreate}>
              {t("investments.pos_add")}
            </Button>
          </Group>
        </Group>

        {!isDesktop && (
          <MobileFilterSheet
            title={t("investments.filters_title")}
            closeLabel={t("common.close")}
            activeCount={activeFilterCount}
            onReset={resetFilters}
            resetLabel={t("common.reset")}
          >
            <Stack gap="sm">{filterControls(true)}</Stack>
          </MobileFilterSheet>
        )}

        {error ? (
          <Alert color="red" m="md">
            {error.message}
          </Alert>
        ) : isLoading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : items.length === 0 && firstSyncPending ? (
          <Center py="xl">
            <Stack align="center" gap={6}>
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                {t("investments.pos_syncing")}
              </Text>
            </Stack>
          </Center>
        ) : items.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xl">
            {t("investments.pos_empty")}
          </Text>
        ) : (
          <Box ref={setTableScrollEl} style={{ overflowX: "auto" }}>
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
                  <Table.Th ta="right">{t("investments.col_current_price")}</Table.Th>
                  <Table.Th ta="right">PnL</Table.Th>
                  <Table.Th ta="right">ROI, %</Table.Th>
                  <Table.Th>{t("investments.col_account")}</Table.Th>
                  <Table.Th>{t("investments.col_opened_at")}</Table.Th>
                  <Table.Th>{t("investments.col_closed_at")}</Table.Th>
                  <Table.Th ta="right">{t("investments.col_days")}</Table.Th>
                  <Table.Th w={122} ta="right" className="pinned-col">
                    {t("investments.col_actions")}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {items.map((p) => {
                  const long = positionDirection(p) === "long"
                  const roi = positionRoi(p)
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
                          {p.status === "OPEN" && (
                            <Badge variant="light" color="green" size="sm">
                              {t("investments.pos_status_open")}
                            </Badge>
                          )}
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
                          {p.avgExitPrice == null
                            ? t("investments.pos_in_trade")
                            : formatUsd(p.avgExitPrice, i18n.language)}
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
                        <Text
                          ff="monospace"
                          size="sm"
                          c={p.currentPrice == null ? "dimmed" : undefined}
                        >
                          {p.status === "OPEN" && p.currentPrice != null
                            ? formatUsd(p.currentPrice, i18n.language)
                            : "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        {positionPnl(p) == null ? (
                          <Text size="sm" c="dimmed">
                            —
                          </Text>
                        ) : (
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            {p.status === "OPEN" && (
                              <Tooltip label={t("investments.pos_pnl_live")}>
                                <IconBolt
                                  size={12}
                                  className="pulse-live"
                                  color="var(--mantine-color-yellow-6)"
                                />
                              </Tooltip>
                            )}
                            <Text ff="monospace" size="sm" fw={500} c={pnlColor(positionPnl(p))}>
                              {formatPnl(positionPnl(p)!, i18n.language)}
                            </Text>
                          </Group>
                        )}
                      </Table.Td>
                      <Table.Td ta="right">
                        {roi == null ? (
                          <Text size="sm" c="dimmed">
                            —
                          </Text>
                        ) : (
                          <Text ff="monospace" size="sm" fw={500} c={pnlColor(roi)}>
                            {formatPct(roi, i18n.language)}
                          </Text>
                        )}
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
                          {p.openedAt ? format(p.openedAt, "d MMM yyyy", { locale }) : "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          ff="monospace"
                          size="sm"
                          c={p.closedAt ? undefined : "dimmed"}
                          style={{ whiteSpace: "nowrap" }}
                        >
                          {p.closedAt ? format(p.closedAt, "d MMM yyyy", { locale }) : "—"}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text ff="monospace" size="sm" c="dimmed">
                          {holdingDays(p) === null ? "—" : holdingDays(p)}
                        </Text>
                      </Table.Td>
                      <Table.Td className="pinned-col">
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          <Tooltip label={t("investments.note_title", { symbol: p.symbol })}>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              color={p.notes.length > 0 ? "blue" : "gray"}
                              aria-label={t("investments.note_title", { symbol: p.symbol })}
                              onClick={() => openNotes(p)}
                            >
                              <IconNotes size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t("common.change")}>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              color={p.source === "manual" ? "blue" : "gray"}
                              aria-label={t("common.change")}
                              disabled={p.source !== "manual"}
                              onClick={() => openEdit(p)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t("common.delete")}>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              color={p.source === "manual" ? "red" : "gray"}
                              aria-label={t("common.delete")}
                              disabled={p.source !== "manual"}
                              onClick={() => openDelete(p)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Box>
        )}

        {/* Table can be wider than the viewport (many columns) — its own scrollbar sits at
            its bottom edge, which is off-screen until you scroll the whole page down. This
            mirrors it at the viewport's bottom edge instead, right above the mobile filter
            handle when that's showing. */}
        <StickyScrollbarX target={tableScrollEl} bottomOffset={isDesktop ? 0 : 48} />

        {total > 0 && (
          <Group justify="space-between" p="md" wrap="wrap" gap="md">
            <Group gap="md" wrap="wrap">
              <Select
                size="xs"
                w={140}
                label={t("investments.pos_page_size")}
                data={POSITIONS_PAGE_SIZE_OPTIONS.map(String)}
                value={String(urlParams.limit)}
                onChange={(v) => v && setParams({ limit: Number(v), page: 1 })}
                allowDeselect={false}
                checkIconPosition="right"
                comboboxProps={{ width: 80 }}
              />
              {/* Sums just the rows on this page — same idea as the transactions table's
                  footer, so it stays honest when the top KPI row covers the whole filter. */}
              {items.length > 0 && (
                <Group gap={6} wrap="nowrap">
                  <Text size="xs" c="dimmed">
                    {t("investments.kpi_page_summary")}
                  </Text>
                  <Text size="xs" fw={600} c={pnlColor(pageTotalPnl)}>
                    {formatPnl(pageTotalPnl, i18n.language)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ·
                  </Text>
                  <Text size="xs">
                    {t("investments.kpi_winrate")}: {pageWinrate === null ? "—" : `${pageWinrate}%`}
                  </Text>
                  <Text size="xs" c="dimmed">
                    ·
                  </Text>
                  <Text size="xs">
                    {t("investments.kpi_trades")}: {items.length}
                  </Text>
                </Group>
              )}
            </Group>
            {totalPages > 1 && (
              <Pagination
                size="sm"
                total={totalPages}
                value={urlParams.page}
                onChange={(page) => setParams({ page })}
              />
            )}
          </Group>
        )}
      </Paper>
    </Stack>
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

/** Below Mantine's sm breakpoint (768px): the three KPIs share one card instead of one each. */
function KpiCompact({
  pnlLabel,
  pnlValue,
  pnlValueColor,
  winrateLabel,
  winrateValue,
  tradesLabel,
  tradesValue,
  caption,
}: {
  pnlLabel: string
  pnlValue: string
  pnlValueColor?: string
  winrateLabel: string
  winrateValue: string
  tradesLabel: string
  tradesValue: string
  caption?: string
}) {
  const stat = (label: string, value: string, color?: string) => (
    <Stack gap={0} style={{ minWidth: 0 }}>
      <Text
        ff="monospace"
        size="xs"
        c="dimmed"
        tt="uppercase"
        truncate="end"
        style={{ letterSpacing: "0.06em" }}
      >
        {label}
      </Text>
      <Text ff="monospace" size="md" fw={500} c={color} truncate="end">
        {value}
      </Text>
    </Stack>
  )

  return (
    <Paper p="sm" hiddenFrom="sm">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        {stat(pnlLabel, pnlValue, pnlValueColor)}
        {stat(winrateLabel, winrateValue)}
        {stat(tradesLabel, tradesValue)}
      </Group>
      {caption && (
        <Text size="xs" c="dimmed" mt={4}>
          {caption}
        </Text>
      )}
    </Paper>
  )
}
