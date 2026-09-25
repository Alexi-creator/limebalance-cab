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
import { IconPlus } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import type { CategoryStats } from "@/modules/categories"
import { useCategoriesStats } from "@/modules/categories/api/useCategoriesStats"
import { GRID_COLS } from "@/modules/categories/config"
import { useCategoriesTour } from "@/modules/categories/hooks/useCategoriesTour"
import { baseAmount, toDisplay } from "@/modules/categories/lib/helpers"
import {
  CategoriesSummary,
  CategoryCard,
  CategoryForm,
  DeleteCategoryConfirm,
  MergeCategoryForm,
} from "@/modules/categories/ui"
import { useUsage } from "@/modules/subscription/api/useUsage"
import { isLimitBlocked } from "@/modules/subscription/lib/plan"
import { LimitAlert } from "@/modules/subscription/ui"
import { TransactionFormModal } from "@/modules/transactions/ui"
import { useModalStore } from "@/shared/store/modalStore"
import { TourTriggerButton } from "@/shared/ui/TourTriggerButton"
import classes from "./styles.module.css"

export function CategoriesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: "expense" | "income" = searchParams.get("type") === "income" ? "income" : "expense"
  const setTab = (value: "expense" | "income") =>
    setSearchParams({ type: value }, { replace: true })
  const isExpense = tab === "expense"
  const openModal = useModalStore((s) => s.open)
  const { startTour } = useCategoriesTour()

  const { data, isLoading, isError } = useCategoriesStats(isExpense)

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
      children: <TransactionFormModal defaults={{ kind: tab, categoryId }} />,
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
      children: (
        <DeleteCategoryConfirm
          category={category}
          isExpense={isExpense}
          onMerge={() => openMerge(category)}
        />
      ),
    })

  const openMerge = (category: CategoryStats) =>
    openModal({
      size: "sm",
      centered: true,
      title: (
        <Text fw={600} size="md">
          {t("categories.merge_title")}
        </Text>
      ),
      children: <MergeCategoryForm category={category} categories={list} isExpense={isExpense} />,
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
                onMerge={() => openMerge(c)}
                onAdd={() => openAddTransaction(c.id)}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  )
}
