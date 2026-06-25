import { getExpenseCategories } from "@api/expenses"
import { getIncomeCategories } from "@api/incomes"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { CURRENCY_OPTIONS } from "@constants/regionToCurrency"
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Overlay,
  Portal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useDebouncedValue, useDisclosure, useMediaQuery } from "@mantine/hooks"
import { IconChevronUp, IconFilter, IconSearch, IconX } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { getTypeOptions, type TransactionsParams } from "../config"

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

  // debounced search → URL; we write only on an actual change of the search string.
  // Comparison with params.search is required: the identity of setParams changes on
  // every URL change (react-router recreates setSearchParams), and without this
  // check the effect would re-run on page change and reset page to 1.
  useEffect(() => {
    if (debounced === (params.search ?? "")) return
    setParams({ search: debounced || undefined, page: 1 })
  }, [debounced, params.search, setParams])

  const { data: expenseCategories } = useQuery({
    queryKey: expenseKeys.categories,
    queryFn: getExpenseCategories,
    staleTime: CATEGORY_STALE_TIME,
  })
  const { data: incomeCategories } = useQuery({
    queryKey: incomeKeys.categories,
    queryFn: getIncomeCategories,
    staleTime: CATEGORY_STALE_TIME,
  })

  // for a selected type — its categories; for "All" — the union of income and expense ones
  const categories =
    params.type === "expense"
      ? (expenseCategories ?? [])
      : params.type === "income"
        ? (incomeCategories ?? [])
        : [...(expenseCategories ?? []), ...(incomeCategories ?? [])]

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const reset = () => {
    setSearch("")
    setParams({
      type: undefined,
      categoryId: undefined,
      currency: undefined,
      search: undefined,
      from: undefined,
      to: undefined,
      page: 1,
    })
  }

  // count of active filters — shown on the mobile handle (period counts as one)
  const activeCount =
    (params.type ? 1 : 0) +
    (params.categoryId ? 1 : 0) +
    (params.currency ? 1 : 0) +
    (params.search ? 1 : 0) +
    (params.from || params.to ? 1 : 0)

  // `vertical` stacks the controls full-width inside the drawer; the row layout keeps
  // the fixed widths used on desktop.
  const controls = (vertical: boolean) => (
    <>
      <SegmentedControl
        fullWidth={vertical}
        value={params.type ?? "all"}
        onChange={(v) =>
          setParams({
            type: v === "all" ? undefined : (v as "income" | "expense"),
            categoryId: undefined,
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

      <Select
        label={t("common.category")}
        placeholder={t("common.all")}
        data={categoryOptions}
        value={params.categoryId ?? null}
        onChange={(v) => setParams({ categoryId: v ?? undefined, page: 1 })}
        clearable
        searchable
        w={vertical ? "100%" : 180}
      />

      <Select
        label={t("common.currency")}
        placeholder={t("common.all")}
        data={CURRENCY_OPTIONS}
        value={params.currency ?? null}
        onChange={(v) => setParams({ currency: v ?? undefined, page: 1 })}
        clearable
        searchable
        w={vertical ? "100%" : 120}
      />

      <DatePickerInput
        type="range"
        label={t("transactions.period")}
        placeholder={t("transactions.date_range_placeholder")}
        valueFormat="DD MMM YYYY"
        value={[params.from ?? null, params.to ?? null]}
        onChange={([from, to]) =>
          setParams({ from: from ?? undefined, to: to ?? undefined, page: 1 })
        }
        clearable
        allowSingleDateInRange
        w={vertical ? "100%" : 240}
      />

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
        {drawerOpened && <Overlay onClick={drawer.close} zIndex={195} backgroundOpacity={0.55} />}
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
          <Stack gap="sm">{controls(true)}</Stack>
        </Box>
      </Portal>
    </>
  )
}
