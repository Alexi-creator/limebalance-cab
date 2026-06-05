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
import { useEffect, useRef, useState } from "react"
import { type TransactionsParams, TYPE_OPTIONS } from "../config"

interface Props {
  params: TransactionsParams
  setParams: (updates: Partial<TransactionsParams>) => void
}

/**
 * Панель фильтров таблицы операций. Пишет фильтры в URL (через `setParams`),
 * поиск — с дебаунсом; категории грузятся под выбранный тип (для `Все` — недоступны).
 */
export function TransactionsFilters({ params, setParams }: Props) {
  const [search, setSearch] = useState(params.search ?? "")
  const [debounced] = useDebouncedValue(search, 350)
  const isFirstRun = useRef(true)

  // дебаунс-поиск → URL; пропускаем первый прогон, чтобы не сбросить page из ссылки
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    setParams({ search: debounced || undefined, page: 1 })
  }, [debounced, setParams])

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

  // при выбранном типе — его категории, при «Все» — объединение доходных и расходных
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
        data={TYPE_OPTIONS}
      />

      <TextInput
        label="Поиск"
        placeholder="Поиск операций"
        leftSection={<IconSearch size={14} />}
        rightSection={
          search ? (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setSearch("")}
              aria-label="Очистить поиск"
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
        label="Категория"
        placeholder="Все"
        data={categoryOptions}
        value={params.categoryId ?? null}
        onChange={(v) => setParams({ categoryId: v ?? undefined, page: 1 })}
        clearable
        searchable
        w={180}
      />

      <Select
        label="Валюта"
        placeholder="Все"
        data={CURRENCY_OPTIONS}
        value={params.currency ?? null}
        onChange={(v) => setParams({ currency: v ?? undefined, page: 1 })}
        clearable
        searchable
        w={120}
      />

      <DatePickerInput
        type="range"
        label="Период"
        placeholder="Дата от — до"
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
        Сбросить
      </Button>
    </Group>
  )
}
