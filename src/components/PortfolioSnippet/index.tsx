import { RouteNames } from "@constants/routeNames"
import { Box, Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core"
import { useNavigate } from "react-router-dom"

const items = [
  { sym: "BTC", w: 38, c: "var(--mantine-color-lime-4)" },
  { sym: "ETH", w: 24, c: "var(--mantine-color-green-5)" },
  { sym: "USDT", w: 18, c: "var(--mantine-color-dimmed)" },
  { sym: "SOL", w: 12, c: "var(--mantine-color-yellow-5)" },
  { sym: "TON", w: 8, c: "var(--mantine-color-red-5)" },
]

/**
 * Виджет-сниппет инвестиционного портфеля для главного дашборда.
 * Показывает общую стоимость, дневное изменение, цветную полосу распределения активов и легенду.
 * Не принимает пропсов — данные захардкожены (stub).
 */
export function PortfolioSnippet() {
  const navigate = useNavigate()

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text fw={600} size="sm">
          Портфель
        </Text>
        <Button variant="subtle" size="xs" onClick={() => navigate(RouteNames.Investments)}>
          Открыть →
        </Button>
      </Group>
      <Stack p="md" gap="sm">
        <Stack gap={2}>
          <Text ff="monospace" fz={28} fw={500} style={{ letterSpacing: "-0.02em" }}>
            $33 002
          </Text>
          <Text size="xs" c="green.5">
            +$1 248 (+3.92%) сегодня
          </Text>
        </Stack>
        <Box style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden" }}>
          {items.map((it) => (
            <Box key={it.sym} style={{ flex: it.w, background: it.c }} />
          ))}
        </Box>
        <SimpleGrid cols={2} spacing={8}>
          {items.map((it) => (
            <Group key={it.sym} justify="space-between" gap="xs">
              <Group gap={6}>
                <Box w={8} h={8} style={{ background: it.c, borderRadius: 2 }} />
                <Text size="xs">{it.sym}</Text>
              </Group>
              <Text ff="monospace" size="xs" c="dimmed">
                {it.w}%
              </Text>
            </Group>
          ))}
        </SimpleGrid>
      </Stack>
    </Paper>
  )
}
