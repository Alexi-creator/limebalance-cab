import { RouteNames } from "@constants/routeNames"
import { Box, Button, Group, Paper, Stack, Text } from "@mantine/core"
import { useNavigate } from "react-router-dom"

const tx = [
  { icon: "💼", t: "Зарплата · Tinkoff", cat: "Доход", d: "Сегодня", a: "+185 000", pos: true },
  { icon: "☕", t: "Кофе на углу", cat: "Кафе", d: "Сегодня", a: "-420" },
  { icon: "🛒", t: "ВкусВилл", cat: "Еда дома", d: "Вчера", a: "-3 280" },
  { icon: "🏠", t: "Квартплата", cat: "Жильё", d: "12 мая", a: "-18 400" },
  { icon: "🎬", t: "Кинотеатр", cat: "Развлечения", d: "11 мая", a: "-1 200" },
  { icon: "📱", t: "Apple One", cat: "Подписки", d: "10 мая", a: "-1 099" },
]

export function RecentTransactions() {
  const navigate = useNavigate()

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Stack gap={2}>
          <Text fw={600} size="sm">
            Последние операции
          </Text>
          <Text size="xs" c="dimmed">
            За последние 7 дней
          </Text>
        </Stack>
        <Button variant="subtle" size="xs" onClick={() => navigate(RouteNames.Transactions)}>
          Показать все →
        </Button>
      </Group>
      {tx.map((r, i) => (
        <Group
          key={r.t}
          px="md"
          py="sm"
          wrap="nowrap"
          gap="sm"
          style={{
            borderBottom:
              i < tx.length - 1 ? "1px solid var(--mantine-color-default-border)" : "none",
          }}
        >
          <Box
            w={32}
            h={32}
            style={{
              borderRadius: 8,
              background: "var(--mantine-color-default-hover)",
              display: "grid",
              placeItems: "center",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {r.icon}
          </Box>
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" truncate>
              {r.t}
            </Text>
            <Text size="xs" c="dimmed">
              {r.cat}
            </Text>
          </Stack>
          <Text size="xs" c="dimmed" visibleFrom="xs">
            {r.d}
          </Text>
          <Text
            ff="monospace"
            size="sm"
            fw={500}
            c={r.pos ? "green.5" : undefined}
            w={110}
            ta="right"
          >
            {r.a} ₽
          </Text>
        </Group>
      ))}
    </Paper>
  )
}
