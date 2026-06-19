import { RouteNames } from "@constants/routeNames"
import { Box, Button, Group, Paper, Progress, Stack, Text } from "@mantine/core"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

/**
 * Financial goals snippet widget for the home dashboard.
 * Shows a list of goals with progress bars and a button to go to the full goals page.
 * Takes no props — data is hardcoded (stub).
 */
export function GoalsSnippet() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const goals = [
    { icon: "🌴", name: t("goals.mock.vacation"), pct: 68, color: "lime" as const },
    { icon: "🛡️", name: t("goals.mock.cushion"), pct: 42, color: "green" as const },
    { icon: "💻", name: t("goals.mock.laptop"), pct: 90, color: "yellow" as const },
  ]

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text fw={600} size="sm">
          {t("goals.title")}
        </Text>
        <Button variant="subtle" size="xs" onClick={() => navigate(RouteNames.Goals)}>
          {t("home.goals_all")}
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
