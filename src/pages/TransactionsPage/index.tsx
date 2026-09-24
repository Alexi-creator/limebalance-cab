import {
  Anchor,
  Box,
  Button,
  Group,
  HoverCard,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
  useMantineTheme,
} from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { IconPlus } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useCategories } from "@/modules/categories/api/useCategories"
import { ExchangeFormModal, ExchangesMobileList, ExchangesTable } from "@/modules/exchanges/ui"
import { useUsage } from "@/modules/subscription/api/useUsage"
import { isLimitBlocked } from "@/modules/subscription/lib/plan"
import { LimitAlert } from "@/modules/subscription/ui"
import type { Transaction } from "@/modules/transactions"
import { useTransactions } from "@/modules/transactions/api/useTransactions"
import { transactionsParamsSchema } from "@/modules/transactions/config"
import { useTransactionsTour } from "@/modules/transactions/hooks/useTransactionsTour"
import { buildFilterChipGroups } from "@/modules/transactions/lib/filterChips"
import { DEFAULT_PERIOD, periodDates } from "@/modules/transactions/lib/periods"
import {
  ActiveFilterChips,
  BulkDeleteModal,
  TransactionFormModal,
  TransactionsFilters,
  TransactionsMobileList,
  TransactionsTable,
  TransactionsToolbar,
} from "@/modules/transactions/ui"
import { RouteNames } from "@/shared/config/routeNames"
import { usePersistedUrlParams } from "@/shared/hooks/usePersistedUrlParams"
import { useModalStore } from "@/shared/store/modalStore"
import { TourTriggerButton } from "@/shared/ui/TourTriggerButton"

import classes from "./styles.module.css"

export function TransactionsPage() {
  const { t } = useTranslation()
  const theme = useMantineTheme()
  // below `md` the filters live in a bottom drawer whose handle is fixed to the viewport
  // edge — reserve space so it never covers the table footer/pagination.
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`, true, {
    getInitialValueInEffect: false,
  })
  // Below `sm` the five-column table asks for ~1000px on a ~375px screen, so that view is a
  // card list instead. Resolved synchronously (no SSR) to avoid rendering the wrong one first.
  const isTableView = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`, true, {
    getInitialValueInEffect: false,
  })
  // Remembered between visits (see usePersistedUrlParams) — except the page, and a ready-made
  // period comes back with today's dates. A first visit opens on the default period, written
  // into the URL.
  const [urlParams, setParams] = usePersistedUrlParams(transactionsParamsSchema, {
    key: "transactions",
    omit: ["page"],
    onRestore: (p) => periodDates(p.period, p.from, p.to),
    defaults: () => periodDates(DEFAULT_PERIOD),
  })
  // A link with other params but no period (e.g. ?type=income) is on the default one too —
  // it carries no dates, so they are worked out here, for the request and for the filter alike.
  const params = useMemo(
    () =>
      urlParams.period
        ? urlParams
        : { ...urlParams, ...periodDates(undefined, urlParams.from, urlParams.to) },
    [urlParams],
  )
  const openModal = useModalStore((s) => s.open)
  const { startTour } = useTransactionsTour(params.view)

  const apiParams = {
    type: params.type,
    categoryId: params.categoryId,
    currency: params.currency,
    search: params.search,
    from: params.from,
    to: params.to,
    // the default order goes unsent — the server's own default, and a server that predates
    // sorting would reject the params outright
    ...(params.sortBy === "date" && params.sortDir === "desc"
      ? {}
      : { sortBy: params.sortBy, sortDir: params.sortDir }),
    page: params.page,
    limit: params.limit,
  }

  const { data, isLoading, isError, isPlaceholderData } = useTransactions(apiParams)

  // categories are needed to determine whether a transaction can be added at all
  const { data: expenseCategories } = useCategories(true)
  const { data: incomeCategories } = useCategories(false)

  // union of both sets — used to resolve selected category ids into names/emoji for the chips
  const allCategories = [...(expenseCategories ?? []), ...(incomeCategories ?? [])]

  // both lists are loaded and empty — there is nowhere to add a transaction
  const hasNoCategories =
    !!expenseCategories &&
    !!incomeCategories &&
    expenseCategories.length === 0 &&
    incomeCategories.length === 0

  // monthly transaction limit reached on the current plan — block creating more
  const { data: usage } = useUsage()
  const transactionsBlocked = isLimitBlocked(usage?.transactions)

  const [selectedRecords, setSelectedRecords] = useState<Transaction[]>([])
  // The card list has no checkbox column — bulk selection is a mode toggled from the toolbar,
  // so a plain tap can keep opening the transaction's details.
  const [selectionMode, setSelectionMode] = useState(false)

  const toggleSelectionMode = () => {
    setSelectionMode((on) => !on)
    setSelectedRecords([])
  }

  const goToPage = (page: number) => {
    setSelectedRecords([])
    setParams({ page })
  }

  const openAddModal = () =>
    openModal({ size: "lg", centered: true, children: <TransactionFormModal /> })

  const openAddExchange = () =>
    openModal({ size: "lg", centered: true, children: <ExchangeFormModal /> })

  const isExchangesView = params.view === "exchanges"

  const openBulkDelete = () =>
    openModal({
      centered: true,
      title: (
        <Text fw={600} size="md">
          {t("transactions.bulk_delete_title")}
        </Text>
      ),
      children: (
        <BulkDeleteModal transactions={selectedRecords} onSuccess={() => setSelectedRecords([])} />
      ),
    })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  // The footer totals come from the route already computed in the base currency and for the
  // current page's slice (the backend converts currencies at the exchange rate). Refetching on
  // a page/page-size change updates the query key → the totals are recomputed for the visible rows.
  const summary = items.length > 0 ? data?.summary : undefined

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0, paddingBottom: isDesktop ? 0 : 64 }}>
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {isExchangesView ? t("exchanges.section_title") : t("transactions.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {isExchangesView
              ? t("exchanges.subtitle")
              : t("transactions.count_label", { count: total })}
          </Text>
        </Stack>
        <Group gap="xs">
          {/* Hidden until the export API is ready
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            CSV
          </Button>
          */}
          <Box data-tour="tx-add">
            {isExchangesView ? (
              // Exchanges are not transactions, so neither the monthly transaction limit nor the
              // "no categories yet" guard has anything to say about them.
              <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openAddExchange}>
                {t("exchanges.add")}
              </Button>
            ) : transactionsBlocked ? (
              // a disabled button swallows hover, so the tooltip listens on the wrapping Box
              <Tooltip label={t("limits.blocked_button_tooltip")} position="bottom-end" withArrow>
                <Box>
                  <Button
                    size="sm"
                    leftSection={<IconPlus size={14} />}
                    disabled
                    style={{
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: "var(--mantine-color-default-border)",
                    }}
                  >
                    {t("transactions.add")}
                  </Button>
                </Box>
              </Tooltip>
            ) : hasNoCategories ? (
              <HoverCard width={240} shadow="md" withArrow position="bottom-end" openDelay={100}>
                <HoverCard.Target>
                  {/* muted green (variant light) instead of gray data-disabled —
                    so it does not blend in; it stays a hover target for the tooltip, but
                    we suppress the click and mark aria-disabled */}
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    aria-disabled
                    onClick={(e) => e.preventDefault()}
                    style={{ cursor: "default" }}
                  >
                    {t("transactions.add")}
                  </Button>
                </HoverCard.Target>

                <HoverCard.Dropdown>
                  <Text size="sm">
                    {t("transactions.no_categories")}{" "}
                    <Anchor component={Link} to={RouteNames.Categories}>
                      {t("transactions.add_group_link")}
                    </Anchor>
                  </Text>
                </HoverCard.Dropdown>
              </HoverCard>
            ) : (
              <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openAddModal}>
                {t("transactions.add")}
              </Button>
            )}
          </Box>
          <TourTriggerButton onClick={startTour} />
        </Group>
      </Group>

      {/* The transaction limit is about transactions, so the alert belongs to their view only. */}
      {!isExchangesView && <LimitAlert usage={usage?.transactions} kind="transactions" />}

      <Tabs
        value={params.view}
        onChange={(v) => setParams({ view: v === "exchanges" ? "exchanges" : "transactions" })}
      >
        <Tabs.List>
          <Tabs.Tab value="transactions">{t("transactions.title")}</Tabs.Tab>
          <Tabs.Tab value="exchanges" data-tour="tx-exchanges">
            {t("exchanges.tab")}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Paper
        data-tour="tx-list"
        className={classes.card}
        style={{
          // Floor for the card so the table never collapses to nothing on a short screen.
          // On a tall screen flex:1 grows past this and the table owns its internal scroll;
          // on a short screen the card holds this height and Main scrolls to reach it.
          // Below `md` the controls move out to the bottom drawer, so the card can sit lower.
          minHeight: isDesktop ? 420 : 320,
        }}
      >
        {isExchangesView ? (
          isTableView ? (
            <ExchangesTable />
          ) : (
            <ExchangesMobileList />
          )
        ) : (
          <>
            <TransactionsFilters params={params} setParams={setParams} />

            <ActiveFilterChips
              groups={buildFilterChipGroups({ params, categories: allCategories, t, setParams })}
            />

            <TransactionsToolbar
              selectedCount={selectedRecords.length}
              onClearSelection={() => setSelectedRecords([])}
              onBulkDelete={openBulkDelete}
              showSelectionToggle={!isTableView}
              selectionMode={selectionMode}
              onToggleSelectionMode={toggleSelectionMode}
            />

            {isTableView ? (
              <TransactionsTable
                transactions={items}
                total={total}
                page={params.page}
                onPageChange={goToPage}
                recordsPerPage={params.limit}
                onRecordsPerPageChange={(limit) => setParams({ limit, page: 1 })}
                sortBy={params.sortBy}
                sortDir={params.sortDir}
                onSortChange={(sortBy, sortDir) =>
                  // the default order leaves the URL rather than being spelled out in it
                  sortBy === "date" && sortDir === "desc"
                    ? setParams({ sortBy: undefined, sortDir: undefined, page: 1 })
                    : setParams({ sortBy, sortDir, page: 1 })
                }
                fetching={isLoading || isPlaceholderData}
                isError={isError}
                selectedRecords={selectedRecords}
                onSelectedRecordsChange={setSelectedRecords}
                summary={summary}
                type={params.type}
              />
            ) : (
              <TransactionsMobileList
                transactions={items}
                total={total}
                page={params.page}
                onPageChange={goToPage}
                recordsPerPage={params.limit}
                fetching={isLoading || isPlaceholderData}
                isError={isError}
                selectedRecords={selectedRecords}
                onSelectedRecordsChange={setSelectedRecords}
                selectionMode={selectionMode}
                summary={summary}
                type={params.type}
              />
            )}
          </>
        )}
      </Paper>
    </Stack>
  )
}
