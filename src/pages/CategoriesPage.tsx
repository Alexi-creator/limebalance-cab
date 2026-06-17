import { getExpenseCategoriesStats } from "@api/expenses"
import { getIncomeCategoriesStats } from "@api/incomes"
import type { CategoryStats } from "@appTypes/category"
import { AddModal } from "@components/AddModal"
import { CategoriesSummary } from "@components/categories/CategoriesSummary"
import { CategoryCard } from "@components/categories/CategoryCard"
import { CategoryForm } from "@components/categories/CategoryForm"
import { GRID_COLS } from "@components/categories/config"
import { DeleteCategoryConfirm } from "@components/categories/DeleteCategoryConfirm"
import { baseAmount, toDisplay } from "@components/categories/helpers"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import {
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

export function CategoriesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: "expense" | "income" = searchParams.get("type") === "income" ? "income" : "expense"
  const setTab = (value: "expense" | "income") =>
    setSearchParams({ type: value }, { replace: true })
  const isExpense = tab === "expense"
  const openModal = useModalStore((s) => s.open)

  const { data, isLoading, isError } = useQuery({
    queryKey: isExpense ? expenseKeys.categoriesStats : incomeKeys.categoriesStats,
    queryFn: isExpense ? () => getExpenseCategoriesStats() : () => getIncomeCategoriesStats(),
    staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
  })

  const list = (data ?? []).map(toDisplay)
  const maxSpent = Math.max(...list.map(baseAmount), 1)

  // открыть форму создания (без аргумента) или редактирования (с категорией)
  const openForm = (category?: CategoryStats) =>
    openModal({
      size: "md",
      centered: true,
      title: (
        <Stack gap={2}>
          <Text fw={600} size="md">
            {category ? t("categories.form_edit_title") : t("categories.new")}
          </Text>
          <Text size="xs" c="dimmed">
            {t("categories.form_subtitle")}
          </Text>
        </Stack>
      ),
      children: <CategoryForm category={category} defaultType={tab} />,
    })

  // быстрое создание операции по конкретной категории: тип берём из текущей вкладки
  const openAddTransaction = (categoryId: string) =>
    openModal({
      size: "lg",
      centered: true,
      children: (
        <AddModal type="transaction" lockType transactionDefaults={{ kind: tab, categoryId }} />
      ),
    })

  const openDelete = (category: CategoryStats) =>
    openModal({
      size: "sm",
      centered: true,
      title: (
        <Text fw={600} size="md">
          {t("categories.delete_title")}
        </Text>
      ),
      children: <DeleteCategoryConfirm category={category} isExpense={isExpense} />,
    })

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("categories.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {isExpense
              ? t("categories.count_expense", { count: list.length })
              : t("categories.count_income", { count: list.length })}
          </Text>
        </Stack>
        <Group gap="xs">
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as "expense" | "income")}
            data={[
              { value: "expense", label: t("common.expense_plural") },
              { value: "income", label: t("common.income_plural") },
            ]}
          />
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => openForm()}>
            {t("categories.new")}
          </Button>
        </Group>
      </Group>

      {isError ? (
        <Paper p="xl">
          <Text c="red.5" ta="center">
            {t("categories.load_error")}
          </Text>
        </Paper>
      ) : isLoading ? (
        <SimpleGrid cols={GRID_COLS} spacing="md">
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: статичные плейсхолдеры загрузки
            <Skeleton key={i} h={120} radius="md" />
          ))}
        </SimpleGrid>
      ) : list.length === 0 ? (
        <Paper p="xl">
          <Text c="dimmed" ta="center">
            {t("categories.empty")}
          </Text>
        </Paper>
      ) : (
        <>
          <CategoriesSummary list={list} isExpense={isExpense} />
          <SimpleGrid cols={GRID_COLS} spacing="md">
            {list.map((c) => (
              <CategoryCard
                key={c.id}
                cat={c}
                maxSpent={maxSpent}
                isExpense={isExpense}
                onEdit={() => openForm(c)}
                onDelete={() => openDelete(c)}
                onAdd={() => openAddTransaction(c.id)}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  )
}
