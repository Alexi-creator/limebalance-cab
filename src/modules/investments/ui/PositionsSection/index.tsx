import {
  ActionIcon,
  Alert,
  Autocomplete,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  LoadingOverlay,
  Pagination,
  Paper,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
  useMantineTheme,
} from "@mantine/core"
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks"
import { notifications } from "@mantine/notifications"
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
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { PeriodFilter } from "@/modules/transactions/ui"
import { useUrlParams } from "@/shared/hooks/useUrlParams"
import { dateFnsLocales } from "@/shared/i18n/languages.ts"
import { useModalStore } from "@/shared/store/modalStore"
import { MobileFilterSheet } from "@/shared/ui/MobileFilterSheet"
import { SortableTh, type SortDir } from "@/shared/ui/SortableTh"
import { SortSelect } from "@/shared/ui/SortSelect"
import { StickyScrollbarX } from "@/shared/ui/StickyScrollbarX"
import type { PositionsParams } from "../../api/requests"
import { useEquityCurve } from "../../api/useEquityCurve"
import { usePositionSymbols } from "../../api/usePositionSymbols"
import { usePositions, usePositionsSummary } from "../../api/usePositions"
import { useSyncExchangeAccounts } from "../../api/useSyncExchangeAccounts"
import { formatPct, formatPnl, formatQty, formatUsd, pnlColor } from "../../lib/format"
import {
  baseAssetFromSymbol,
  DUST_USD,
  type ExchangeAccount,
  holdingDays,
  type Position,
  type PositionSortField,
  positionDirection,
  positionPnl,
  positionRoi,
  stopLossPnl,
  takeProfitPnl,
  unleveragedQty,
} from "../../model"
import { CategoryBadge } from "../CategoryBadge"
import { CoinIcon } from "../CoinIcon"
import { DeletePositionConfirm } from "../DeletePositionConfirm"
import { PositionForm } from "../PositionForm"
import { PositionNotes } from "../PositionNotes"
import { PositionsMobileList } from "../PositionsMobileList"
import { POSITIONS_PAGE_SIZE_OPTIONS, positionsParamsSchema, storePageSize } from "./config"

import classes from "./styles.module.css"

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
  const theme = useMantineTheme()
  // Below `md` the filter controls don't fit in a row — they move into a bottom drawer,
  // same pattern as the transactions table (see MobileFilterSheet).
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`, true, {
    getInitialValueInEffect: false,
  })
  // Below `sm` the seventeen-column table asks for well over 1500px on a ~375px screen, so that
  // view is a card list instead (same trade-off as the transactions table). Resolved
  // synchronously (no SSR) to avoid rendering the wrong one first.
  const isTableView = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true, {
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
    pnl: urlParams.pnl === "all" ? undefined : urlParams.pnl,
    // Default view: the sub-dollar leftovers are out. The KPI row and the page count come from
    // the same filtered set, so winrate and "trades" stay about trades (see DUST_USD).
    hideDust: urlParams.dust === "hide",
  }
  // Sort only orders the page — the KPI row reads filterParams, so a re-sort doesn't refetch it.
  // The default order goes unsent: it is the server's own default anyway.
  const isDefaultSort = urlParams.sortBy === "openedAt" && urlParams.sortDir === "desc"
  const params: PositionsParams = {
    ...filterParams,
    ...(isDefaultSort ? {} : { sortBy: urlParams.sortBy, sortDir: urlParams.sortDir }),
    limit: urlParams.limit,
    offset: (urlParams.page - 1) * urlParams.limit,
  }

  const { data, isLoading, isFetching, error } = usePositions(params)

  // the default order leaves the URL rather than being spelled out in it
  const onSort = (sortBy: PositionSortField, sortDir: SortDir) =>
    sortBy === "openedAt" && sortDir === "desc"
      ? setParams({ sortBy: undefined, sortDir: undefined, page: 1 })
      : setParams({ sortBy, sortDir, page: 1 })
  const sortProps = {
    sortBy: urlParams.sortBy,
    sortDir: urlParams.sortDir,
    defaultField: "openedAt" as const,
    onSort,
  }
  const sortFields: { value: PositionSortField; label: string }[] = [
    { value: "openedAt", label: t("investments.col_opened_at") },
    { value: "closedAt", label: t("investments.col_closed_at") },
    { value: "pnl", label: "PnL" },
    { value: "roi", label: "ROI, %" },
    { value: "volume", label: t("investments.col_volume") },
    { value: "duration", label: t("investments.col_days") },
  ]
  const { data: symbolsData } = usePositionSymbols()
  const symbolOptions = symbolsData?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / urlParams.limit)
  const items = data?.items ?? []

  // `lastSyncAt` stays null until an account's first sync finishes (see AccountsSection) —
  // reuse that signal here so a freshly connected account shows "syncing" instead of the
  // plain empty state right after the tab switches to the journal.
  const firstSyncPending = accounts.some((a) => a.lastSyncAt === null)

  // Top KPI row — over the whole current filter selection (symbol/account/period/category),
  // not just the visible page. Aggregated server-side, no page cap.
  const { data: summaryData } = usePositionsSummary(filterParams)
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
    hideDust: filterParams.hideDust,
  }
  const { data: equityData } = useEquityCurve(chartParams)
  const earliestClosedAt = equityData?.items[0]?.closedAt

  // Page summary (bottom row, next to pagination) — over just the rows shown on this page,
  // same idea as the transactions table's footer. Combines realized PnL for closed trades
  // with live unrealized PnL for open ones via the same accessor the PnL column itself uses.
  const pageItemsWithPnl = items.filter((p) => positionPnl(p) !== null)
  const pageTotalPnl = pageItemsWithPnl.reduce((s, p) => s + (positionPnl(p) ?? 0), 0)
  const pageWins = pageItemsWithPnl.filter((p) => (positionPnl(p) ?? 0) > 0).length
  const pageWinrate = pageItemsWithPnl.length
    ? Math.round((pageWins / pageItemsWithPnl.length) * 100)
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
  const syncMutation = useSyncExchangeAccounts({
    onSuccess: () =>
      notifications.show({ color: "green", message: t("investments.acc_sync_success") }),
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.label }))
  const accountById = new Map(accounts.map((a) => [a.id, a]))

  // count of active filters — shown on the mobile drawer's handle
  const activeFilterCount =
    (debouncedSymbol ? 1 : 0) +
    (range[0] || range[1] ? 1 : 0) +
    (urlParams.accountId ? 1 : 0) +
    (urlParams.category !== "all" ? 1 : 0) +
    (urlParams.status !== "all" ? 1 : 0) +
    (urlParams.pnl !== "all" ? 1 : 0) +
    (urlParams.dust === "show" ? 1 : 0)

  // Back to the schema defaults — status included, so this also restores the default
  // "All" view.
  const resetFilters = () => {
    setSymbolInput("")
    setParams({
      symbol: undefined,
      accountId: undefined,
      period: "all",
      from: undefined,
      to: undefined,
      status: undefined,
      category: "all",
      pnl: "all",
      dust: "hide",
      page: 1,
    })
  }

  // `vertical` stacks the controls full-width for the drawer; the row layout keeps the fixed
  // widths used on desktop. Same split as TransactionsFilters' `controls(vertical)`.
  const filterControls = (vertical: boolean) => (
    <>
      <Autocomplete
        size={vertical ? "sm" : "xs"}
        label={t("investments.col_symbol")}
        w={vertical ? "100%" : 140}
        placeholder="BTCUSDT"
        data={symbolOptions}
        limit={20}
        leftSection={<IconSearch size={14} />}
        rightSection={
          symbolInput ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setSymbolInput("")}
              aria-label={t("investments.filter_symbol_clear")}
            >
              <IconX size={14} />
            </ActionIcon>
          ) : null
        }
        rightSectionPointerEvents="auto"
        value={symbolInput}
        onChange={setSymbolInput}
      />
      <PeriodFilter
        size={vertical ? "sm" : "xs"}
        vertical={vertical}
        period={urlParams.period}
        from={urlParams.from}
        to={urlParams.to}
        onChange={(update) => setParams({ ...update, page: 1 })}
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
      <Select
        size={vertical ? "sm" : "xs"}
        w={vertical ? "100%" : 140}
        label={t("investments.filter_pnl")}
        placeholder={t("investments.filter_pnl")}
        allowDeselect={false}
        data={[
          { value: "all", label: t("common.all") },
          { value: "positive", label: t("investments.pnl_positive") },
          { value: "negative", label: t("investments.pnl_negative") },
        ]}
        value={urlParams.pnl}
        onChange={(v) => v && setParams({ pnl: v as "all" | "positive" | "negative", page: 1 })}
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
      {/* Checked by default (dust="hide"): a wallet accumulates unsellable sub-dollar remainders
          faster than trades, and a page of those buries the real ones. Unchecking brings them
          back — they're hidden, not deleted. */}
      <Checkbox
        size="xs"
        label={t("investments.filter_hide_dust", { amount: formatUsd(DUST_USD, i18n.language) })}
        checked={urlParams.dust === "hide"}
        onChange={(e) => setParams({ dust: e.currentTarget.checked ? "hide" : "show", page: 1 })}
      />
      {/* the card list has no headers to click — in the sheet, the sort gets a picker of its own */}
      {vertical && (
        <SortSelect
          fields={sortFields}
          sortBy={urlParams.sortBy}
          sortDir={urlParams.sortDir}
          onChange={onSort}
        />
      )}
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

      <Paper className={classes.card}>
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
                  onClick={() =>
                    syncMutation.mutate(
                      (urlParams.accountId
                        ? accounts.filter((a) => a.id === urlParams.accountId)
                        : accounts
                      ).map((a) => a.id),
                    )
                  }
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

        <Box pos="relative">
          {/* Covers the table + footer while a filter/page change refetches — the query keeps
              the previous page's rows visible in the meantime (placeholderData), so without
              this the UI otherwise looks like the filter did nothing. */}
          <LoadingOverlay
            visible={isFetching && !isLoading}
            overlayProps={{ radius: "sm", blur: 1 }}
            loaderProps={{ size: "sm" }}
          />
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
          ) : !isTableView ? (
            <PositionsMobileList positions={items} accounts={accounts} />
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
                    <SortableTh field="pnl" ta="right" {...sortProps}>
                      PnL
                    </SortableTh>
                    <Table.Th ta="center">{t("investments.col_tp_sl")}</Table.Th>
                    <SortableTh field="roi" ta="right" {...sortProps}>
                      ROI, %
                    </SortableTh>
                    <SortableTh field="volume" ta="right" miw={130} {...sortProps}>
                      {t("investments.col_volume")}
                    </SortableTh>
                    <Table.Th ta="center">{t("investments.col_entry_exit")}</Table.Th>
                    <Table.Th ta="right">{t("investments.col_current_price")}</Table.Th>
                    <SortableTh field="openedAt" {...sortProps}>
                      {t("investments.col_opened_at")}
                    </SortableTh>
                    <SortableTh field="closedAt" {...sortProps}>
                      {t("investments.col_closed_at")}
                    </SortableTh>
                    <SortableTh field="duration" ta="right" {...sortProps}>
                      {t("investments.col_days")}
                    </SortableTh>
                    <Table.Th ta="right">{t("investments.col_qty")}</Table.Th>
                    <Table.Th ta="right">{t("investments.col_leverage")}</Table.Th>
                    <Table.Th ta="right" miw={110}>
                      {t("investments.col_fee")}
                    </Table.Th>
                    <Table.Th>{t("investments.col_account")}</Table.Th>
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
                          <Group gap={8} wrap="nowrap">
                            <CoinIcon ticker={baseAssetFromSymbol(p.symbol)} size={20} />
                            <Text ff="monospace" size="sm" fw={500}>
                              {p.symbol}
                            </Text>
                          </Group>
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
                        <Table.Td ta="center">
                          {p.takeProfitPrice == null && p.stopLossPrice == null ? (
                            <Text size="sm" c="dimmed">
                              —
                            </Text>
                          ) : (
                            <Stack gap={0} align="center">
                              <Text
                                ff="monospace"
                                size="xs"
                                c="green.6"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {p.takeProfitPrice == null
                                  ? "—"
                                  : `${formatUsd(p.takeProfitPrice, i18n.language)} (${formatPnl(takeProfitPnl(p)!, i18n.language)})`}
                              </Text>
                              <Text
                                ff="monospace"
                                size="xs"
                                c="red.6"
                                style={{ whiteSpace: "nowrap" }}
                              >
                                {p.stopLossPrice == null
                                  ? "—"
                                  : `${formatUsd(p.stopLossPrice, i18n.language)} (${formatPnl(stopLossPnl(p)!, i18n.language)})`}
                              </Text>
                            </Stack>
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
                        <Table.Td ta="right">
                          <Text ff="monospace" size="sm">
                            {formatUsd(p.entryVolumeUsd, i18n.language)}
                          </Text>
                        </Table.Td>
                        <Table.Td ta="center">
                          <Text
                            ff="monospace"
                            size="sm"
                            c="dimmed"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            {formatUsd(p.avgEntryPrice, i18n.language)} →{" "}
                            {p.avgExitPrice == null
                              ? t("investments.pos_in_trade")
                              : formatUsd(p.avgExitPrice, i18n.language)}
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
                          {p.status === "OPEN" ? (
                            <Tooltip label={t("investments.pos_days_live")}>
                              <Text ff="monospace" size="sm" c="dimmed" className="pulse-live">
                                {holdingDays(p) ?? "—"}
                              </Text>
                            </Tooltip>
                          ) : (
                            <Text ff="monospace" size="sm" c="dimmed">
                              {holdingDays(p) ?? "—"}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text ff="monospace" size="sm">
                            {formatQty(unleveragedQty(p), i18n.language)}
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
                            c={pnlColor(p.totalFeeUsd == null ? null : -p.totalFeeUsd)}
                          >
                            {/* Fee sign is flipped for display: paying (positive fee) reads as a
                              loss, a rebate (negative fee) reads as a gain — same convention as PnL. */}
                            {p.totalFeeUsd == null ? "—" : formatPnl(-p.totalFeeUsd, i18n.language)}
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
                  onChange={(v) => {
                    if (!v) return
                    storePageSize(Number(v))
                    setParams({ limit: Number(v), page: 1 })
                  }}
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
                      {t("investments.kpi_winrate")}:{" "}
                      {pageWinrate === null ? "—" : `${pageWinrate}%`}
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
                  // on a phone the page numbers in between don't fit — prev/next plus the
                  // current page is the whole usable control there
                  siblings={isTableView ? 1 : 0}
                  boundaries={isTableView ? 1 : 0}
                  total={totalPages}
                  value={urlParams.page}
                  onChange={(page) => setParams({ page })}
                />
              )}
            </Group>
          )}
        </Box>
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
