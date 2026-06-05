import { RouteNames } from "@constants/routeNames"
import { ActionIcon, Box, Group, Paper, Progress, Stack, Text, Tooltip } from "@mantine/core"
import { IconEdit, IconPlus, IconReceipt, IconTrash } from "@tabler/icons-react"
import { formatCurrency } from "@utils/formatCurrency"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { baseAmount, pluralRu } from "../helpers"
import type { DisplayCategory } from "../types"

interface Props {
  cat: DisplayCategory
  /** Максимальная сумма (в базовой валюте) среди категорий — для нормировки шкалы. */
  maxSpent: number
  isExpense: boolean
  onEdit: () => void
  onDelete: () => void
  /** Быстро создать операцию по этой категории */
  onAdd: () => void
}

/** Карточка категории: иконка, имя, число операций, сумма и шкала доли от максимума. */
export function CategoryCard({ cat, maxSpent, isExpense, onEdit, onDelete, onAdd }: Props) {
  const { i18n } = useTranslation()
  const language = i18n.language
  const [hovered, setHovered] = useState(false)

  const comparable = baseAmount(cat)
  const pct = comparable > 0 ? (comparable / maxSpent) * 100 : 0
  const sign = isExpense ? "−" : "+"
  const empty = cat.totals.length === 0
  const multiCurrency = cat.totals.length > 1

  // основная сумма: одна валюта — точная; несколько — приведённая к базовой («≈»)
  let headline: string
  if (empty) {
    headline = formatCurrency(0, language, cat.baseCurrency)
  } else if (multiCurrency) {
    headline =
      cat.approxTotal != null
        ? `≈ ${sign}${formatCurrency(cat.approxTotal, language, cat.baseCurrency)}`
        : "—"
  } else {
    headline = `${sign}${formatCurrency(cat.totals[0].total, language, cat.totals[0].currency)}`
  }

  return (
    <Paper
      p="md"
      pb="sm"
      pos="relative"
      style={{ overflow: "hidden" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Group gap={4} pos="absolute" top={8} right={8} wrap="nowrap">
        {/* редактирование/удаление — только при наведении; добавление операции видно всегда */}
        <Group
          gap={4}
          wrap="nowrap"
          style={{ opacity: hovered ? 1 : 0, transition: "opacity .15s" }}
        >
          <Tooltip label="Операции по категории">
            <ActionIcon
              component={Link}
              to={`${RouteNames.Transactions}?type=${isExpense ? "expense" : "income"}&categoryId=${cat.id}`}
              variant="subtle"
              size="sm"
              color="gray"
            >
              <IconReceipt size={14} />
            </ActionIcon>
          </Tooltip>
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
        <Tooltip label={isExpense ? "Добавить расход" : "Добавить доход"}>
          <ActionIcon variant="light" size="sm" color="lime" onClick={onAdd}>
            <IconPlus size={14} />
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
        <Group justify="space-between" align="baseline" wrap="nowrap">
          <Text size="xs" c="dimmed">
            За всё время
          </Text>
          <Text
            ff="monospace"
            size="sm"
            fw={500}
            ta="right"
            c={empty ? "dimmed" : isExpense ? undefined : "green.5"}
          >
            {headline}
          </Text>
        </Group>
        {multiCurrency && (
          <Text ff="monospace" size="xs" c="dimmed" ta="right">
            {cat.totals.map((t) => formatCurrency(t.total, language, t.currency)).join(" · ")}
          </Text>
        )}
        <Progress
          value={pct}
          size={3}
          pos="absolute"
          bottom={0}
          left={0}
          right={0}
          radius={0}
          styles={{ section: { background: cat.color } }}
        />
      </Stack>
    </Paper>
  )
}
