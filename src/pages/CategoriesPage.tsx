import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  ColorSwatch,
  Group,
  Modal,
  Paper,
  Progress,
  ScrollArea,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core"
import { IconAlertTriangle, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { useMemo, useState } from "react"

interface Category {
  id: number
  icon: string
  name: string
  color: string
  spent: number
  count: number
  system: boolean
  _new?: boolean
}

const SEED_EXPENSE: Category[] = [
  {
    id: 1,
    icon: "🛒",
    name: "Еда дома",
    color: "var(--mantine-color-lime-4)",
    spent: 22600,
    count: 18,
    system: false,
  },
  {
    id: 2,
    icon: "☕",
    name: "Кафе",
    color: "var(--mantine-color-yellow-5)",
    spent: 14800,
    count: 24,
    system: false,
  },
  {
    id: 3,
    icon: "🏠",
    name: "Жильё",
    color: "var(--mantine-color-blue-5)",
    spent: 32400,
    count: 3,
    system: true,
  },
  {
    id: 4,
    icon: "⛽",
    name: "Транспорт",
    color: "var(--mantine-color-cyan-5)",
    spent: 12200,
    count: 11,
    system: false,
  },
  {
    id: 5,
    icon: "🎬",
    name: "Развлечения",
    color: "var(--mantine-color-red-5)",
    spent: 9800,
    count: 7,
    system: false,
  },
  {
    id: 6,
    icon: "📱",
    name: "Подписки",
    color: "var(--mantine-color-grape-5)",
    spent: 6400,
    count: 5,
    system: false,
  },
  {
    id: 7,
    icon: "💪",
    name: "Здоровье",
    color: "var(--mantine-color-green-5)",
    spent: 8200,
    count: 4,
    system: false,
  },
  {
    id: 8,
    icon: "📚",
    name: "Образование",
    color: "var(--mantine-color-orange-5)",
    spent: 2180,
    count: 2,
    system: false,
  },
  {
    id: 9,
    icon: "🌱",
    name: "Накопления",
    color: "var(--mantine-color-teal-5)",
    spent: 40000,
    count: 1,
    system: true,
  },
  {
    id: 10,
    icon: "•",
    name: "Прочее",
    color: "var(--mantine-color-dimmed)",
    spent: 1920,
    count: 6,
    system: true,
  },
]

const SEED_INCOME: Category[] = [
  {
    id: 11,
    icon: "💼",
    name: "Зарплата",
    color: "var(--mantine-color-lime-4)",
    spent: 185000,
    count: 1,
    system: true,
  },
  {
    id: 12,
    icon: "💻",
    name: "Фриланс",
    color: "var(--mantine-color-green-5)",
    spent: 33800,
    count: 2,
    system: false,
  },
  {
    id: 13,
    icon: "📊",
    name: "Дивиденды",
    color: "var(--mantine-color-blue-5)",
    spent: 0,
    count: 0,
    system: false,
  },
  {
    id: 14,
    icon: "🎁",
    name: "Подарок",
    color: "var(--mantine-color-yellow-5)",
    spent: 0,
    count: 0,
    system: false,
  },
  {
    id: 15,
    icon: "↩",
    name: "Возврат",
    color: "var(--mantine-color-dimmed)",
    spent: 0,
    count: 0,
    system: false,
  },
]

const ICON_PALETTE = [
  "🛒",
  "☕",
  "🏠",
  "🚗",
  "⛽",
  "🎬",
  "📱",
  "💪",
  "📚",
  "🌱",
  "💼",
  "💻",
  "🎁",
  "📊",
  "↩",
  "💳",
  "🍔",
  "✈️",
  "🎓",
  "💊",
  "👕",
  "🐾",
  "💡",
  "🍷",
  "🎮",
  "✂️",
  "🚌",
  "🚲",
  "🏖️",
  "🎵",
  "📦",
  "🛠️",
  "🌐",
  "💰",
  "•",
]

const COLOR_PALETTE = [
  "var(--mantine-color-lime-4)",
  "var(--mantine-color-green-5)",
  "var(--mantine-color-yellow-5)",
  "var(--mantine-color-red-5)",
  "var(--mantine-color-blue-5)",
  "var(--mantine-color-cyan-5)",
  "var(--mantine-color-grape-5)",
  "var(--mantine-color-orange-5)",
  "var(--mantine-color-teal-5)",
  "var(--mantine-color-pink-5)",
  "var(--mantine-color-indigo-5)",
  "var(--mantine-color-violet-5)",
  "var(--mantine-color-dimmed)",
]

function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}

export function CategoriesPage() {
  const [tab, setTab] = useState<"expense" | "income">("expense")
  const [expense, setExpense] = useState(SEED_EXPENSE)
  const [income, setIncome] = useState(SEED_INCOME)
  const [edit, setEdit] = useState<Category | null>(null)
  const [confirmDel, setConfirmDel] = useState<Category | null>(null)

  const list = tab === "expense" ? expense : income
  const setList = tab === "expense" ? setExpense : setIncome

  const totalSpent = list.reduce((s, c) => s + c.spent, 0)
  const maxSpent = Math.max(...list.map((c) => c.spent), 1)
  const totalCount = list.reduce((s, c) => s + c.count, 0)

  const save = (cat: Category) => {
    if (cat._new) {
      setList([...list, { ...cat, id: Date.now(), spent: 0, count: 0, system: false, _new: false }])
    } else {
      setList(list.map((c) => (c.id === cat.id ? { ...c, ...cat } : c)))
    }
    setEdit(null)
  }

  const remove = (cat: Category) => {
    setList(list.filter((c) => c.id !== cat.id))
    setConfirmDel(null)
  }

  const openNew = () =>
    setEdit({
      id: 0,
      _new: true,
      icon: "🛒",
      color: COLOR_PALETTE[0],
      name: "",
      spent: 0,
      count: 0,
      system: false,
    })

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Категории
          </Title>
          <Text size="sm" c="dimmed">
            {expense.length} категорий расходов · {income.length} категорий доходов
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
          <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openNew}>
            Новая категория
          </Button>
        </Group>
      </Group>

      <Paper p="lg">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {tab === "expense" ? "Расход за май" : "Доход за май"}
            </Text>
            <Text ff="monospace" fz={24} fw={500} c={tab === "expense" ? "red.5" : "green.5"}>
              {tab === "expense" ? "−" : "+"}
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

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
        {list.map((c) => (
          <CategoryCard
            key={c.id}
            cat={c}
            maxSpent={maxSpent}
            isExpense={tab === "expense"}
            onEdit={() => setEdit(c)}
            onDelete={() => setConfirmDel(c)}
          />
        ))}
        <Paper
          p="xl"
          style={{
            borderStyle: "dashed",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
          onClick={openNew}
        >
          <Stack align="center" gap="xs">
            <Box
              w={44}
              h={44}
              c="lime.4"
              style={{
                borderRadius: 12,
                background: "var(--mantine-color-default-hover)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <IconPlus size={20} />
            </Box>
            <Text size="sm" fw={500}>
              Новая категория
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              {tab === "expense" ? "Например, Хобби или Путешествия" : "Например, Бонус или Кэшбэк"}
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>

      <CategoryFormModal
        cat={edit}
        isExpense={tab === "expense"}
        existing={list}
        onClose={() => setEdit(null)}
        onSave={save}
      />
      <ConfirmDeleteModal cat={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={remove} />
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
  cat: Category
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
        {!cat.system && (
          <Tooltip label="Удалить">
            <ActionIcon variant="subtle" size="sm" color="gray" onClick={onDelete}>
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        )}
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
          <Group gap={6} wrap="nowrap">
            <Text fw={500} truncate>
              {cat.name}
            </Text>
            {cat.system && (
              <Badge variant="default" size="xs" radius="sm" tt="lowercase">
                система
              </Badge>
            )}
          </Group>
          <Text ff="monospace" size="xs" c="dimmed">
            {cat.count} {pluralRu(cat.count, ["операция", "операции", "операций"])}
          </Text>
        </Stack>
      </Group>

      <Stack gap={6} mt="md">
        <Group justify="space-between" align="baseline">
          <Text size="xs" c="dimmed">
            За май
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

function CategoryFormModal({
  cat,
  isExpense,
  existing,
  onClose,
  onSave,
}: {
  cat: Category | null
  isExpense: boolean
  existing: Category[]
  onClose: () => void
  onSave: (c: Category) => void
}) {
  const [draft, setDraft] = useState<Category | null>(null)

  useMemo(() => {
    if (cat) setDraft(cat)
  }, [cat])
  if (!cat || !draft) return null

  const isNew = !!cat._new
  const duplicate = existing.some(
    (c) => c.id !== cat.id && c.name.trim().toLowerCase() === draft.name.trim().toLowerCase(),
  )
  const canSave = draft.name.trim().length > 0 && !duplicate

  return (
    <Modal
      opened={!!cat}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Text fw={600}>{isNew ? "Новая категория" : "Изменить категорию"}</Text>
          <Text size="xs" c="dimmed">
            {isExpense ? "Для расходов" : "Для доходов"}
          </Text>
        </Stack>
      }
      size="md"
      radius="md"
      centered
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (canSave) onSave(draft)
        }}
      >
        <Stack gap="md">
          <Paper p="sm" bg="var(--mantine-color-default)">
            <Group gap="sm">
              <Box
                w={48}
                h={48}
                fz={22}
                style={{
                  borderRadius: 12,
                  background: `color-mix(in oklab, ${draft.color} 22%, var(--mantine-color-default-hover))`,
                  border: `1px solid color-mix(in oklab, ${draft.color} 30%, transparent)`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {draft.icon}
              </Box>
              <Stack gap={2}>
                <Text fw={500}>{draft.name || "Название категории"}</Text>
                <Text size="xs" c="dimmed">
                  Так будет в списке операций и графиках
                </Text>
              </Stack>
            </Group>
          </Paper>

          <TextInput
            label="Название"
            required
            autoFocus
            placeholder="Например, Подарки близким"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.currentTarget.value })}
            maxLength={32}
            error={duplicate ? "Категория с таким названием уже есть" : undefined}
            description={`${draft.name.length}/32`}
          />

          <Box>
            <Text size="sm" fw={500} mb={6}>
              Иконка
            </Text>
            <ScrollArea h={140} type="auto">
              <SimpleGrid cols={9} spacing={6}>
                {ICON_PALETTE.map((i) => (
                  <ActionIcon
                    key={i}
                    type="button"
                    size="lg"
                    radius="sm"
                    variant={draft.icon === i ? "light" : "default"}
                    color={draft.icon === i ? "lime" : "gray"}
                    onClick={() => setDraft({ ...draft, icon: i })}
                  >
                    <Text size="md">{i}</Text>
                  </ActionIcon>
                ))}
              </SimpleGrid>
            </ScrollArea>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={6}>
              Цвет
            </Text>
            <Group gap="xs">
              {COLOR_PALETTE.map((col) => (
                <ColorSwatch
                  key={col}
                  color={col}
                  size={28}
                  onClick={() => setDraft({ ...draft, color: col })}
                  style={{
                    cursor: "pointer",
                    outline: draft.color === col ? "2px solid var(--mantine-color-lime-4)" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </Group>
          </Box>

          {cat.system && !isNew && (
            <Alert variant="light" color="gray" radius="md">
              Системную категорию нельзя удалить, но можно переименовать и изменить вид.
            </Alert>
          )}

          <Group
            justify="flex-end"
            pt="sm"
            style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
          >
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={!canSave}>
              {isNew ? "Создать" : "Сохранить"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

function ConfirmDeleteModal({
  cat,
  onClose,
  onConfirm,
}: {
  cat: Category | null
  onClose: () => void
  onConfirm: (c: Category) => void
}) {
  if (!cat) return null
  return (
    <Modal
      opened={!!cat}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Text fw={600}>Удалить категорию?</Text>
          <Text size="xs" c="dimmed">
            «{cat.name}» · {cat.count} {pluralRu(cat.count, ["операция", "операции", "операций"])}
          </Text>
        </Stack>
      }
      size="sm"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Alert variant="light" color="red" icon={<IconAlertTriangle size={16} />} radius="md">
          Операции этой категории будут перенесены в <b>Прочее</b>. Действие необратимо.
        </Alert>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button color="red" onClick={() => onConfirm(cat)}>
            Удалить
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
