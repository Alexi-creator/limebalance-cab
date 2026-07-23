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
import { LimitAlert } from "@components/LimitAlert"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import { useCategoriesTour } from "@hooks/useCategoriesTour"
import { useUsage } from "@hooks/useUsage"
import {
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { TourTriggerButton } from "@ui/TourTriggerButton"
import { isLimitBlocked } from "@utils/subscription"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import classes from "./CategoriesPage.module.css"

export function CategoriesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: "expense" | "income" = searchParams.get("type") === "income" ? "income" : "expense"
  const setTab = (value: "expense" | "income") =>
    setSearchParams({ type: value }, { replace: true })
  const isExpense = tab === "expense"
  const openModal = useModalStore((s) => s.open)
  const { startTour } = useCategoriesTour()

  const { data, isLoading, isError } = useQuery({
    queryKey: isExpense ? expenseKeys.categoriesStats : incomeKeys.categoriesStats,
    queryFn: isExpense ? () => getExpenseCategoriesStats() : () => getIncomeCategoriesStats(),
    staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
  })

  // the categories limit is plan-wide (expense + income together), so it does not depend on the tab
  const { data: usage } = useUsage()
  const categoriesBlocked = isLimitBlocked(usage?.categories)

  const list = (data ?? []).map(toDisplay)
  const maxSpent = Math.max(...list.map(baseAmount), 1)

  // open the create form (without an argument) or the edit form (with a category)
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

  // quick transaction creation for a specific category: the type is taken from the current tab
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
            data-tour="cat-toggle"
            classNames={{ root: classes.typeControl }}
            value={tab}
            onChange={(v) => setTab(v as "expense" | "income")}
            data={[
              { value: "expense", label: t("common.expense_plural") },
              { value: "income", label: t("common.income_plural") },
            ]}
          />
          <Box data-tour="cat-add">
            {categoriesBlocked ? (
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
                    {t("categories.new")}
                  </Button>
                </Box>
              </Tooltip>
            ) : (
              <Button size="sm" leftSection={<IconPlus size={14} />} onClick={() => openForm()}>
                {t("categories.new")}
              </Button>
            )}
          </Box>
          <TourTriggerButton onClick={startTour} />
        </Group>
      </Group>

      <LimitAlert usage={usage?.categories} kind="categories" />

      {isError ? (
        <Paper p="xl">
          <Text c="red.5" ta="center">
            {t("categories.load_error")}
          </Text>
        </Paper>
      ) : isLoading ? (
        <SimpleGrid cols={GRID_COLS} spacing="md">
          {Array.from({ length: 8 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static loading placeholders
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
          <SimpleGrid data-tour="cat-grid" cols={GRID_COLS} spacing="md">
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
