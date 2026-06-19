import { getExpenseCategories } from "@api/expenses"
import { getIncomeCategories } from "@api/incomes"
import { CATEGORY_STALE_TIME } from "@constants/queries/categories"
import { expenseKeys } from "@constants/queries/expenses"
import { incomeKeys } from "@constants/queries/incomes"
import { CURRENCY_OPTIONS } from "@constants/regionToCurrency"
import { ActionIcon, Button, Group, SegmentedControl, Select, TextInput } from "@mantine/core"
import { DatePickerInput } from "@mantine/dates"
import { useDebouncedValue } from "@mantine/hooks"
import { IconSearch, IconX } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { getTypeOptions, type TransactionsParams } from "../config"

interface Props {
  params: TransactionsParams
  setParams: (updates: Partial<TransactionsParams>) => void
}

/**
 * Filter panel for the transactions table. Writes filters to the URL (via `setParams`),
 * search — debounced; categories are loaded for the selected type (unavailable for "All").
 */
export function TransactionsFilters({ params, setParams }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState(params.search ?? "")
  const [debounced] = useDebouncedValue(search, 350)

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

  return (
    <Group
      p="md"
      gap="sm"
      wrap="wrap"
      style={{ borderBottom: "1px solid var(--mantine-color-default-border)", flexShrink: 0 }}
    >
      <SegmentedControl
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
        style={{ flex: 1, minWidth: 220 }}
      />

      <Select
        label={t("common.category")}
        placeholder={t("common.all")}
        data={categoryOptions}
        value={params.categoryId ?? null}
        onChange={(v) => setParams({ categoryId: v ?? undefined, page: 1 })}
        clearable
        searchable
        w={180}
      />

      <Select
        label={t("common.currency")}
        placeholder={t("common.all")}
        data={CURRENCY_OPTIONS}
        value={params.currency ?? null}
        onChange={(v) => setParams({ currency: v ?? undefined, page: 1 })}
        clearable
        searchable
        w={120}
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
        w={240}
      />

      <Button
        variant="light"
        color="red"
        size="sm"
        leftSection={<IconX size={14} />}
        onClick={reset}
      >
        {t("common.reset")}
      </Button>
    </Group>
  )
}
