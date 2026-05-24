import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core"
import { IconDotsVertical, IconDownload, IconPlus, IconSearch } from "@tabler/icons-react"
import { useMemo, useState } from "react"

interface Tx {
  id: number
  icon: string
  t: string
  cat: string
  d: string
  a: number
  pos?: boolean
  acc: string
}

const TX_ALL: Tx[] = [
  {
    id: 1,
    icon: "💼",
    t: "Зарплата · Tinkoff",
    cat: "Доход",
    d: "23 мая 2026",
    a: 185000,
    pos: true,
    acc: "Тинькофф",
  },
  { id: 2, icon: "☕", t: "Кофе на углу", cat: "Кафе", d: "23 мая 2026", a: -420, acc: "Тинькофф" },
  {
    id: 3,
    icon: "🛒",
    t: "ВкусВилл",
    cat: "Еда дома",
    d: "22 мая 2026",
    a: -3280,
    acc: "Тинькофф",
  },
  {
    id: 4,
    icon: "💻",
    t: "Фриланс-проект · оплата",
    cat: "Доход",
    d: "21 мая 2026",
    a: 33800,
    pos: true,
    acc: "Сбер",
  },
  { id: 5, icon: "🏠", t: "Квартплата", cat: "Жильё", d: "12 мая 2026", a: -18400, acc: "Сбер" },
  {
    id: 6,
    icon: "🎬",
    t: "Кинотеатр Каро",
    cat: "Развлечения",
    d: "11 мая 2026",
    a: -1200,
    acc: "Тинькофф",
  },
  {
    id: 7,
    icon: "📱",
    t: "Apple One",
    cat: "Подписки",
    d: "10 мая 2026",
    a: -1099,
    acc: "Тинькофф",
  },
  {
    id: 8,
    icon: "⛽",
    t: "АЗС Газпромнефть",
    cat: "Транспорт",
    d: "09 мая 2026",
    a: -3450,
    acc: "Кэш",
  },
  { id: 9, icon: "🍔", t: "Доставка еды", cat: "Кафе", d: "08 мая 2026", a: -890, acc: "Тинькофф" },
  { id: 10, icon: "💪", t: "Спортзал", cat: "Здоровье", d: "05 мая 2026", a: -3500, acc: "Сбер" },
  {
    id: 11,
    icon: "📚",
    t: "Книги · Лабиринт",
    cat: "Образование",
    d: "04 мая 2026",
    a: -2180,
    acc: "Тинькофф",
  },
  {
    id: 12,
    icon: "🌱",
    t: "Перевод на накопления",
    cat: "Накопления",
    d: "01 мая 2026",
    a: -40000,
    acc: "Тинькофф",
  },
]

const CAT_OPTS = [
  "Все",
  "Доход",
  "Кафе",
  "Еда дома",
  "Жильё",
  "Транспорт",
  "Развлечения",
  "Подписки",
  "Здоровье",
  "Образование",
  "Накопления",
]
const ACC_OPTS = ["Все", "Тинькофф", "Сбер", "Кэш"]

export function TransactionsPage() {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState<string | null>("Все")
  const [acc, setAcc] = useState<string | null>("Все")
  const [tab, setTab] = useState("Все")

  const rows = useMemo(
    () =>
      TX_ALL.filter(
        (r) =>
          (tab === "Все" || (tab === "Доходы" && r.pos) || (tab === "Расходы" && !r.pos)) &&
          (cat === "Все" || r.cat === cat) &&
          (acc === "Все" || r.acc === acc) &&
          (!q || r.t.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, cat, acc, tab],
  )

  const totalIn = rows.filter((r) => r.pos).reduce((s, r) => s + r.a, 0)
  const totalOut = rows.filter((r) => !r.pos).reduce((s, r) => s + Math.abs(r.a), 0)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Операции
          </Title>
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              {rows.length} операций ·
            </Text>
            <Text size="sm" c="green.5">
              +{totalIn.toLocaleString("ru-RU")} ₽
            </Text>
            <Text size="sm" c="dimmed">
              ·
            </Text>
            <Text size="sm" c="red.5">
              −{totalOut.toLocaleString("ru-RU")} ₽
            </Text>
          </Group>
        </Stack>
        <Group gap="xs">
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            CSV
          </Button>
          <Button size="sm" leftSection={<IconPlus size={14} />}>
            Добавить операцию
          </Button>
        </Group>
      </Group>

      <Paper>
        <Group
          p="md"
          gap="sm"
          wrap="wrap"
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
        >
          <SegmentedControl value={tab} onChange={setTab} data={["Все", "Доходы", "Расходы"]} />
          <TextInput
            placeholder="Поиск операций"
            leftSection={<IconSearch size={14} />}
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <Select placeholder="Категория" data={CAT_OPTS} value={cat} onChange={setCat} w={180} />
          <Select placeholder="Счёт" data={ACC_OPTS} value={acc} onChange={setAcc} w={140} />
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              setQ("")
              setCat("Все")
              setAcc("Все")
              setTab("Все")
            }}
          >
            Сбросить
          </Button>
        </Group>

        <Table verticalSpacing="sm" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Операция</Table.Th>
              <Table.Th>Категория</Table.Th>
              <Table.Th>Счёт</Table.Th>
              <Table.Th>Дата</Table.Th>
              <Table.Th ta="right">Сумма</Table.Th>
              <Table.Th w={40} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>
                  <Group gap="sm">
                    <Box
                      w={32}
                      h={32}
                      style={{
                        borderRadius: 8,
                        background: "var(--mantine-color-default-hover)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 14,
                      }}
                    >
                      {r.icon}
                    </Box>
                    <Text size="sm">{r.t}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Badge variant="default" size="sm">
                    {r.cat}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {r.acc}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c="dimmed">
                    {r.d}
                  </Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text ff="monospace" size="sm" fw={500} c={r.pos ? "green.5" : undefined}>
                    {r.pos ? "+" : ""}
                    {r.a.toLocaleString("ru-RU")} ₽
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Tooltip label="Действия">
                    <ActionIcon variant="subtle" size="sm" color="gray">
                      <IconDotsVertical size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
            {rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center" py="xl">
                  <Text c="dimmed">Ничего не найдено</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
