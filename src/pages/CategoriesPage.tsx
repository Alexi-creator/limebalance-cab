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
import { useSearchParams } from "react-router-dom"

export function CategoriesPage() {
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
            {category ? "Изменить категорию" : "Новая категория"}
          </Text>
          <Text size="xs" c="dimmed">
            Доход или расход — учтётся в аналитике
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
          Удалить категорию?
        </Text>
      ),
      children: <DeleteCategoryConfirm category={category} isExpense={isExpense} />,
    })

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Категории
          </Title>
          <Text size="sm" c="dimmed">
            {list.length} {isExpense ? "категорий расходов" : "категорий доходов"}
          </Text>
        </Stack>
        <Group gap="xs">
          <SegmentedControl
            value={tab}
            onChange={(v) => setTab(v as "expense" | "income")}
            data={[
              { value: "expense", label: "Расходы" },
              { value: "income", label: "Доходы" },
            ]}
          />
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => openForm()}>
            Новая категория
          </Button>
        </Group>
      </Group>

      {isError ? (
        <Paper p="xl">
          <Text c="red.5" ta="center">
            Не удалось загрузить категории
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
            Категорий пока нет
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
