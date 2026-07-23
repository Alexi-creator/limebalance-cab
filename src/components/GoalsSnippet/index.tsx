import { getGoals } from "@api/goals"
import { GOALS_STALE_TIME, goalKeys } from "@constants/queries/goals"
import { RouteNames } from "@constants/routeNames"
import { Box, Button, Center, Group, Paper, Progress, Skeleton, Stack, Text } from "@mantine/core"
import { IconPlus } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

/** Bar color matching the goals page rule (red <25% / yellow near deadline / green). */
function barColor(progress: number, monthsLeft: number | null, isCompleted: boolean): string {
  if (progress < 25) return "red"
  if (!isCompleted && monthsLeft !== null && monthsLeft <= 2) return "yellow"
  return "green"
}

/**
 * Financial goals snippet for the home dashboard — shows the first few active goals with their
 * progress bars and a link to the full goals page.
 */
export function GoalsSnippet() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: goalKeys.all,
    queryFn: getGoals,
    staleTime: GOALS_STALE_TIME,
  })

  const goals = (data?.items ?? []).slice(0, 4)

  return (
    <Paper data-tour="goals">
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
        {isLoading ? (
          <Stack gap="sm" py="sm">
            <Skeleton h={28} />
            <Skeleton h={28} />
            <Skeleton h={28} />
          </Stack>
        ) : goals.length === 0 ? (
          <Center py="md">
            <Button
              variant="outline"
              color="green"
              size="sm"
              leftSection={<IconPlus size={14} />}
              onClick={() => navigate(RouteNames.Goals, { state: { openCreate: true } })}
            >
              {t("goals.add_title")}
            </Button>
          </Center>
        ) : (
          goals.map((g, i) => {
            const color = barColor(g.progress, g.monthsLeft, g.isCompleted)
            return (
              <Box
                key={g.id}
                py="sm"
                onClick={() => navigate(RouteNames.Goals, { state: { goalId: g.id } })}
                style={{
                  cursor: "pointer",
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
                      {g.emoji ?? "🎯"}
                    </Box>
                    <Text size="sm">{g.name}</Text>
                  </Group>
                  <Text ff="monospace" size="sm" c={`${color}.5`}>
                    {g.progress}%
                  </Text>
                </Group>
                <Progress value={g.progress} color={color} size="sm" />
              </Box>
            )
          })
        )}
      </Stack>
    </Paper>
  )
}
