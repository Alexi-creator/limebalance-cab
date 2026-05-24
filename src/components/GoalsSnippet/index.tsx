import { RouteNames } from "@constants/routeNames"
import { Box, Button, Group, Paper, Progress, Stack, Text } from "@mantine/core"
import { useNavigate } from "react-router-dom"

const goals = [
  { icon: "🌴", name: "Отпуск Бали", pct: 68, color: "lime" as const },
  { icon: "🛡️", name: "Подушка x6", pct: 42, color: "green" as const },
  { icon: "💻", name: "Ноутбук", pct: 90, color: "yellow" as const },
]

export function GoalsSnippet() {
  const navigate = useNavigate()

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text fw={600} size="sm">
          Цели
        </Text>
        <Button variant="subtle" size="xs" onClick={() => navigate(RouteNames.Goals)}>
          Все →
        </Button>
      </Group>
      <Stack gap={0} px="md" pb="md" pt="xs">
        {goals.map((g, i) => (
          <Box
            key={g.name}
            py="sm"
            style={{
              borderBottom:
                i < goals.length - 1 ? "1px solid var(--mantine-color-default-border)" : "none",
            }}
          >
            <Group justify="space-between" mb={6}>
              <Group gap="xs">
                <Box
                  w={26}
                  h={26}
                  style={{
                    background: "var(--mantine-color-default-hover)",
                    borderRadius: 8,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                  }}
                >
                  {g.icon}
                </Box>
                <Text size="sm">{g.name}</Text>
              </Group>
              <Text ff="monospace" size="sm" c={`${g.color}.5`}>
                {g.pct}%
              </Text>
            </Group>
            <Progress value={g.pct} color={g.color} size="sm" />
          </Box>
        ))}
      </Stack>
    </Paper>
  )
}
