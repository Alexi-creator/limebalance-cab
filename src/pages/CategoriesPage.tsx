import { getExpenseCategoriesStats } from "@api/expenses"
import { getIncomeCategoriesStats } from "@api/incomes"
import type { CategoryStats } from "@appTypes/category"
import { CategoryForm } from "@components/categories/CategoryForm"
import { COLOR_PALETTE, EMOJI_PALETTE } from "@components/categories/config"
import { DeleteCategoryConfirm } from "@components/categories/DeleteCategoryConfirm"
import { EXPENSE_STALE_TIME, expenseKeys } from "@constants/queries/expenses"
import { INCOME_STALE_TIME, incomeKeys } from "@constants/queries/incomes"
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

const GRID_COLS = { base: 1, sm: 2, lg: 3, xl: 4 }

/** Статистика категории + готовые к показу icon/color (emoji — с бэка либо фолбэк из палитры). */
interface DisplayCategory extends CategoryStats {
  icon: string
  color: string
  spent: number
}

function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

/** Достраивает статистику: emoji с бэка (иначе фолбэк из палитры) и цвет по индексу. */
function toDisplay(stat: CategoryStats, index: number): DisplayCategory {
  return {
    ...stat,
    icon: stat.emoji || EMOJI_PALETTE[index % EMOJI_PALETTE.length],
    color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    spent: stat.total,
  }
}

export function CategoriesPage() {
  const [tab, setTab] = useState<"expense" | "income">("expense")
  const isExpense = tab === "expense"
  const openModal = useModalStore((s) => s.open)

  const { data, isLoading, isError } = useQuery({
    queryKey: isExpense ? expenseKeys.categoriesStats : incomeKeys.categoriesStats,
    queryFn: isExpense ? () => getExpenseCategoriesStats() : () => getIncomeCategoriesStats(),
    staleTime: isExpense ? EXPENSE_STALE_TIME : INCOME_STALE_TIME,
  })

  const list = (data ?? []).map(toDisplay)
  const totalSpent = list.reduce((s, c) => s + c.spent, 0)
  const maxSpent = Math.max(...list.map((c) => c.spent), 1)
  const totalCount = list.reduce((s, c) => s + c.count, 0)

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
          <Paper p="lg">
            <Group justify="space-between" mb="md" wrap="wrap">
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  {isExpense ? "Расход за всё время" : "Доход за всё время"}
                </Text>
                <Text ff="monospace" fz={24} fw={500} c={isExpense ? "red.5" : "green.5"}>
                  {isExpense ? "−" : "+"}
                  {totalSpent.toLocaleString("ru-RU")} ₽
                </Text>
              </Stack>
              <Text ff="monospace" size="xs" c="dimmed">
                {totalCount} {pluralRu(totalCount, ["операция", "операции", "операций"])} в{" "}
                {list.length} {pluralRu(list.length, ["категории", "категориях", "категориях"])}
              </Text>
            </Group>
            <Box
              style={{
                display: "flex",
                height: 10,
                borderRadius: 99,
                overflow: "hidden",
                background: "var(--mantine-color-default-hover)",
              }}
            >
              {list
                .filter((c) => c.spent > 0)
                .sort((a, b) => b.spent - a.spent)
                .map((c) => (
                  <Tooltip
                    key={c.id}
                    label={`${c.name} · ${Math.round((c.spent / totalSpent) * 100)}%`}
                  >
                    <Box style={{ flex: c.spent, background: c.color }} />
                  </Tooltip>
                ))}
            </Box>
          </Paper>

          <SimpleGrid cols={GRID_COLS} spacing="md">
            {list.map((c) => (
              <CategoryCard
                key={c.id}
                cat={c}
                maxSpent={maxSpent}
                isExpense={isExpense}
                onEdit={() => openForm(c)}
                onDelete={() => openDelete(c)}
              />
            ))}
          </SimpleGrid>
        </>
      )}
    </Stack>
  )
}

function CategoryCard({
  cat,
  maxSpent,
  isExpense,
  onEdit,
  onDelete,
}: {
  cat: DisplayCategory
  maxSpent: number
  isExpense: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const pct = cat.spent > 0 ? (cat.spent / maxSpent) * 100 : 0

  return (
    <Paper
      p="md"
      pos="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Group
        gap={4}
        pos="absolute"
        top={8}
        right={8}
        style={{ opacity: hovered ? 1 : 0, transition: "opacity .15s" }}
      >
        <Tooltip label="Изменить">
          <ActionIcon variant="subtle" size="sm" color="gray" onClick={onEdit}>
            <IconEdit size={14} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Удалить">
          <ActionIcon variant="subtle" size="sm" color="gray" onClick={onDelete}>
            <IconTrash size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap="sm">
        <Box
          w={44}
          h={44}
          fz={20}
          style={{
            borderRadius: 12,
            background: `color-mix(in oklab, ${cat.color} 22%, var(--mantine-color-default-hover))`,
            border: `1px solid color-mix(in oklab, ${cat.color} 30%, transparent)`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {cat.icon}
        </Box>
        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
          <Text fw={500} truncate>
            {cat.name}
          </Text>
          <Text ff="monospace" size="xs" c="dimmed">
            {cat.count} {pluralRu(cat.count, ["операция", "операции", "операций"])}
          </Text>
        </Stack>
      </Group>

      <Stack gap={6} mt="md">
        <Group justify="space-between" align="baseline">
          <Text size="xs" c="dimmed">
            За всё время
          </Text>
          <Text
            ff="monospace"
            size="sm"
            fw={500}
            c={cat.spent === 0 ? "dimmed" : isExpense ? undefined : "green.5"}
          >
            {cat.spent > 0 ? (isExpense ? "−" : "+") : ""}
            {cat.spent.toLocaleString("ru-RU")} ₽
          </Text>
        </Group>
        <Progress value={pct} size="xs" styles={{ section: { background: cat.color } }} />
      </Stack>
    </Paper>
  )
}
