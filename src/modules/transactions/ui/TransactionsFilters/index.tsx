import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Overlay,
  Portal,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core"
import { useDebouncedValue, useDisclosure, useMediaQuery } from "@mantine/hooks"
import { IconChevronUp, IconFilter, IconSearch, IconX } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCategories } from "@/modules/categories/api/useCategories"
import type { PresetFilters } from "@/modules/presets"
import { FilterPresets } from "@/modules/presets/ui"
import { useCurrencyOptions } from "@/shared/hooks/useCurrencyOptions"
import { useSidebarStore } from "@/shared/store/sidebarStore"
import { SortSelect } from "@/shared/ui/SortSelect"
import {
  getTransactionSortFields,
  getTypeOptions,
  PAGE_SIZE_OPTIONS,
  type TransactionsParams,
} from "../../config"
import { buildFilterChipGroups } from "../../lib/filterChips"
import { transactionsFromPreset, transactionsToPreset } from "../../lib/presetFilters"
import { ActiveFilterChips } from "../ActiveFilterChips"
import { MultiSelectFilter } from "../MultiSelectFilter"
import { PeriodFilter } from "../PeriodFilter"

interface Props {
  params: TransactionsParams
  setParams: (updates: Partial<TransactionsParams>) => void
}

/**
 * Filter panel for the transactions table. Writes filters to the URL (via `setParams`),
 * search — debounced; categories are loaded for the selected type (unavailable for "All").
 *
 * Below the `md` breakpoint the controls do not fit in a row, so they move into a
 * bottom drawer: a fixed handle peeks at the bottom edge and slides the panel up on tap.
 */
export function TransactionsFilters({ params, setParams }: Props) {
  const { t } = useTranslation()
  const theme = useMantineTheme()
  const [search, setSearch] = useState(params.search ?? "")
  const [debounced] = useDebouncedValue(search, 350)
  // when the mobile nav menu is open, its sheet covers the screen — keep our fixed filter
  // handle/sheet hidden so it doesn't paint over the menu's content
  const menuOpened = useSidebarStore((s) => s.opened)

  // resolve synchronously on first render (no SSR here) to avoid a layout flash
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`, true, {
    getInitialValueInEffect: false,
  })
  const [drawerOpened, drawer] = useDisclosure(false)

  // The handle/sheet should span the content area edge-to-edge — i.e. the `Main` box
  // (sidebar edge → viewport right), not the table card, which is inset by Main's
  // padding. We drop a zero-height anchor, walk up to its <main>, and mirror its
  // left/right gaps onto the fixed handle/sheet — re-measuring on resize and sidebar toggles.
  const anchorRef = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<{ left: number; right: number } | null>(null)
  useEffect(() => {
    if (isDesktop) return
    const el = anchorRef.current
    if (!el) return
    const target = el.closest("main") ?? el
    const update = () => {
      const r = target.getBoundingClientRect()
      // store left/right gaps to the viewport so the handle and sheet can be pinned to the
      // content-area edges via left+right (auto width) — no width math that can overflow
      setBounds({ left: r.left, right: window.innerWidth - r.right })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(target)
    window.addEventListener("resize", update)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [isDesktop])

  // debounced search → URL; we write only on an actual change of the typed string. The effect
  // re-runs on every URL change too (setParams' identity changes with it), so it bails unless
  // `debounced` itself moved: otherwise a page change would reset page to 1, and a search set
  // from outside (reset, a preset) would be overwritten by the input's still-debouncing value.
  const lastDebounced = useRef(debounced)
  useEffect(() => {
    if (debounced === lastDebounced.current) return
    lastDebounced.current = debounced
    if (debounced === (params.search ?? "")) return
    setParams({ search: debounced || undefined, page: 1 })
  }, [debounced, params.search, setParams])

  const { data: expenseCategories } = useCategories(true)
  const { data: incomeCategories } = useCategories(false)

  // for a selected type — its categories; for "All" — the union of income and expense ones
  const categories =
    params.type === "expense"
      ? (expenseCategories ?? [])
      : params.type === "income"
        ? (incomeCategories ?? [])
        : [...(expenseCategories ?? []), ...(incomeCategories ?? [])]

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.emoji ? `${c.emoji} ${c.name}` : c.name,
  }))

  const currencyOptions = useCurrencyOptions()

  // removable chips for the active multi-select filters — surfaced inside the drawer so the
  // selection is visible there too (categories are resolved against the full union, not the
  // type-filtered list, so a selected id still shows after switching the type tab)
  const chipGroups = buildFilterChipGroups({
    params,
    categories: [...(expenseCategories ?? []), ...(incomeCategories ?? [])],
    t,
    setParams,
  })

  const reset = () => {
    setSearch("")
    setParams({
      type: undefined,
      categoryId: [],
      currency: [],
      search: undefined,
      period: "all",
      from: undefined,
      to: undefined,
      page: 1,
    })
  }

  const applyPreset = (filters: PresetFilters) => {
    const next = transactionsFromPreset(filters)
    setSearch(next.search ?? "")
    setParams(next)
  }

  // count of active filters — shown on the mobile handle (period counts as one)
  const activeCount =
    (params.type ? 1 : 0) +
    (params.categoryId.length > 0 ? 1 : 0) +
    (params.currency.length > 0 ? 1 : 0) +
    (params.search ? 1 : 0) +
    (params.from || params.to ? 1 : 0)

  // `vertical` stacks the controls full-width inside the drawer; the row layout keeps
  // the fixed widths used on desktop.
  const controls = (vertical: boolean) => (
    <>
      <FilterPresets
        scope="transactions"
        current={transactionsToPreset(params)}
        onApply={applyPreset}
        fullWidth={vertical}
      />

      <SegmentedControl
        fullWidth={vertical}
        value={params.type ?? "all"}
        onChange={(v) =>
          setParams({
            type: v === "all" ? undefined : (v as "income" | "expense"),
            categoryId: [],
            page: 1,
          })
        }
        data={getTypeOptions(t)}
      />

      <TextInput
        label={t("common.search")}
        placeholder={t("transactions.search_placeholder")}
        leftSection={<IconSearch size={14} />}
        rightSection={
          search ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setSearch("")}
              aria-label={t("transactions.clear_search")}
            >
              <IconX size={14} />
            </ActionIcon>
          ) : null
        }
        rightSectionPointerEvents="auto"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={vertical ? { width: "100%" } : { flex: 1, minWidth: 220 }}
      />

      <MultiSelectFilter
        label={t("common.category")}
        placeholder={t("common.all")}
        data={categoryOptions}
        value={params.categoryId}
        onChange={(v) => setParams({ categoryId: v, page: 1 })}
        summary={(count) => t("transactions.categories_selected", { count })}
        w={vertical ? "100%" : 180}
      />

      <MultiSelectFilter
        label={t("common.currency")}
        placeholder={t("common.all")}
        data={currencyOptions}
        value={params.currency}
        onChange={(v) => setParams({ currency: v, page: 1 })}
        summary={(count) => t("transactions.currencies_selected", { count })}
        w={vertical ? "100%" : 160}
      />

      <PeriodFilter
        period={params.period}
        from={params.from}
        to={params.to}
        onChange={(update) => setParams({ ...update, page: 1 })}
        vertical={vertical}
      />

      {/* the card list has no headers to click — in the drawer, the sort gets a picker of its own */}
      {vertical && (
        <SortSelect
          fields={getTransactionSortFields(t)}
          sortBy={params.sortBy}
          sortDir={params.sortDir}
          onChange={(sortBy, sortDir) =>
            sortBy === "date" && sortDir === "desc"
              ? setParams({ sortBy: undefined, sortDir: undefined, page: 1 })
              : setParams({ sortBy, sortDir, page: 1 })
          }
        />
      )}

      {/* same for the page size — the card list's pagination has no picker of its own */}
      {vertical && (
        <Stack gap={4}>
          <Text size="sm" fw={500}>
            {t("transactions.records_per_page")}
          </Text>
          <SegmentedControl
            fullWidth
            value={String(params.limit)}
            onChange={(v) => setParams({ limit: Number(v), page: 1 })}
            data={PAGE_SIZE_OPTIONS.map(String)}
          />
        </Stack>
      )}

      <Button
        variant="light"
        color="red"
        size="sm"
        fullWidth={vertical}
        leftSection={<IconX size={14} />}
        onClick={reset}
      >
        {t("common.reset")}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Group
        p="md"
        gap="sm"
        wrap="wrap"
        align="flex-end"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)", flexShrink: 0 }}
      >
        {controls(false)}
      </Group>
    )
  }

  return (
    <>
      {/* zero-height marker measured to align the handle/drawer with the table block */}
      <div ref={anchorRef} style={{ height: 0 }} />

      {/* While the mobile nav menu is open it covers the screen — hiding the fixed handle and
          sheet keeps them from painting over the menu's content. */}
      {!menuOpened && (
        <>
          {/* peeking handle pinned to the bottom edge, spanning the table block width */}
          <Portal>
            <UnstyledButton
              onClick={drawer.open}
              aria-label={t("transactions.filters")}
              style={{
                position: "fixed",
                bottom: 0,
                left: bounds?.left ?? 0,
                right: bounds?.right ?? 0,
                zIndex: 190,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                backgroundColor: "var(--mantine-color-body)",
                borderTop: "1px solid var(--mantine-color-default-border)",
                borderTopLeftRadius: "var(--mantine-radius-md)",
                borderTopRightRadius: "var(--mantine-radius-md)",
                boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <IconFilter size={16} />
              <Text size="sm" fw={500}>
                {t("transactions.filters")}
              </Text>
              {activeCount > 0 && (
                <Badge size="sm" variant="filled" circle>
                  {activeCount}
                </Badge>
              )}
              <IconChevronUp size={16} />
            </UnstyledButton>
          </Portal>

          {/* Own slide-up sheet instead of Mantine's bottom Drawer: a plain fixed box with
              left/right pinned to the card edges auto-sizes to the card width (Mantine's
              Drawer forces an explicit full-viewport width on its inner, which overflowed and
              clipped on the right). translateY drives the slide; it sits below the viewport
              when closed, so the peeking handle stays visible underneath. */}
          <Portal>
            {drawerOpened && (
              <Overlay onClick={drawer.close} zIndex={195} backgroundOpacity={0.55} />
            )}
            <Box
              style={{
                position: "fixed",
                bottom: 0,
                left: bounds?.left ?? 0,
                right: bounds?.right ?? 0,
                zIndex: 200,
                maxHeight: "80vh",
                overflowY: "auto",
                padding: "var(--mantine-spacing-md)",
                backgroundColor: "var(--mantine-color-body)",
                borderTop: "1px solid var(--mantine-color-default-border)",
                borderTopLeftRadius: "var(--mantine-radius-md)",
                borderTopRightRadius: "var(--mantine-radius-md)",
                boxShadow: "0 -2px 12px rgba(0, 0, 0, 0.25)",
                transform: drawerOpened ? "translateY(0)" : "translateY(101%)",
                transition: "transform 200ms ease",
              }}
            >
              <Group justify="space-between" mb="sm">
                <Text fw={600}>{t("transactions.filters")}</Text>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={drawer.close}
                  aria-label={t("common.close")}
                >
                  <IconX size={18} />
                </ActionIcon>
              </Group>
              <Stack gap="sm">
                {/* selected-filter chips, mirrored from the table so the picks are visible here */}
                <ActiveFilterChips groups={chipGroups} px={0} withBorder={false} />
                {controls(true)}
              </Stack>
            </Box>
          </Portal>
        </>
      )}
    </>
  )
}
