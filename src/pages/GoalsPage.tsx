import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { useAuthStore } from "@store/authStore"
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"

interface Goal {
  icon: string
  name: string
  target: number
  saved: number
  deadline: string
  color: "lime" | "green" | "yellow" | "red"
  perMonth: number
}

export function GoalsPage() {
  const { t, i18n } = useTranslation()
  const userCurrency = useAuthStore((s) => s.user?.currency)
  const money = (n: number) => formatCurrency(n, i18n.language, userCurrency)

  const goals: Goal[] = [
    {
      icon: "🌴",
      name: t("goals.page_mock.bali"),
      target: 240000,
      saved: 163200,
      deadline: t("goals.page_mock.deadline1"),
      color: "lime",
      perMonth: 19200,
    },
    {
      icon: "🛡️",
      name: t("goals.page_mock.cushion"),
      target: 600000,
      saved: 252000,
      deadline: t("goals.page_mock.deadline2"),
      color: "green",
      perMonth: 50000,
    },
    {
      icon: "💻",
      name: t("goals.page_mock.laptop"),
      target: 180000,
      saved: 162000,
      deadline: t("goals.page_mock.deadline3"),
      color: "yellow",
      perMonth: 9000,
    },
    {
      icon: "🏡",
      name: t("goals.page_mock.mortgage"),
      target: 2400000,
      saved: 336000,
      deadline: t("goals.page_mock.deadline4"),
      color: "red",
      perMonth: 70000,
    },
  ]

  const total = goals.reduce((s, g) => s + g.target, 0)
  const saved = goals.reduce((s, g) => s + g.saved, 0)
  const totalPct = Math.round((saved / total) * 100)

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("goals.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("goals.active_count", { count: goals.length })} · {totalPct}%{" "}
            {t("goals.total_progress")}
          </Text>
        </Stack>
        <Button size="sm" leftSection={<IconPlus size={14} />}>
          {t("goals.new")}
        </Button>
      </Group>

      <Paper p="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              {t("goals.saved_total")}
            </Text>
            <Text ff="monospace" fz={32} fw={500} style={{ letterSpacing: "-0.02em" }}>
              {money(saved)}{" "}
              <Text component="span" c="dimmed" fz={16}>
                / {money(total)}
              </Text>
            </Text>
          </Stack>
          <Box style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed">
                {t("goals.to_final", { pct: totalPct })}
              </Text>
              <Text ff="monospace" size="xs" c="dimmed">
                {t("goals.left_amount", { amount: money(total - saved) })}
              </Text>
            </Group>
            <Progress
              value={totalPct}
              size="md"
              styles={{
                section: {
                  background:
                    "linear-gradient(90deg, var(--mantine-color-lime-4), var(--mantine-color-green-5))",
                },
              }}
            />
          </Box>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100)
          const left = g.target - g.saved
          const monthsLeft = Math.ceil(left / g.perMonth)
          return (
            <Paper key={g.name} p="lg">
              <Group justify="space-between" align="flex-start" mb="md">
                <Group gap="sm">
                  <Box
                    w={48}
                    h={48}
                    style={{
                      borderRadius: 12,
                      background: "var(--mantine-color-default-hover)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 22,
                    }}
                  >
                    {g.icon}
                  </Box>
                  <Stack gap={2}>
                    <Text fw={600}>{g.name}</Text>
                    <Text size="xs" c="dimmed">
                      {t("goals.until", { deadline: g.deadline })}
                    </Text>
                  </Stack>
                </Group>
                <Group gap={4}>
                  <Tooltip label={t("common.change")}>
                    <ActionIcon variant="subtle" size="sm" color="gray">
                      <IconEdit size={14} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("common.delete")}>
                    <ActionIcon variant="subtle" size="sm" color="gray">
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              <Group justify="space-between" align="baseline" mb="xs">
                <Text ff="monospace" fz={24} fw={500} c={`${g.color}.5`}>
                  {pct}%
                </Text>
                <Text ff="monospace" size="sm" c="dimmed">
                  {money(g.saved)} / {money(g.target)}
                </Text>
              </Group>
              <Progress value={pct} color={g.color} size="md" mb="md" />

              <SimpleGrid cols={3} spacing="xs">
                <Tiny label={t("goals.tiny_left")} value={money(left)} />
                <Tiny label={t("goals.tiny_per_month")} value={money(g.perMonth)} />
                <Tiny
                  label={t("goals.tiny_months")}
                  value={t("goals.months_value", { count: monthsLeft })}
                />
              </SimpleGrid>

              <Group mt="md" gap="xs" grow>
                <Button variant="default" size="sm">
                  {t("goals.deposit")}
                </Button>
                <Button variant="subtle" size="sm">
                  {t("goals.history")}
                </Button>
              </Group>
            </Paper>
          )
        })}

        <Paper
          p="lg"
          style={{
            borderStyle: "dashed",
            display: "grid",
            placeItems: "center",
            minHeight: 320,
            cursor: "pointer",
          }}
        >
          <Stack align="center" gap="sm">
            <Box
              w={48}
              h={48}
              style={{
                borderRadius: 12,
                background: "var(--mantine-color-default-hover)",
                display: "grid",
                placeItems: "center",
                color: "var(--mantine-color-lime-4)",
              }}
            >
              <IconPlus size={20} />
            </Box>
            <Text size="sm" fw={500}>
              {t("goals.add_title")}
            </Text>
            <Text size="xs" c="dimmed" ta="center" maw={240}>
              {t("goals.add_subtitle")}
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}

function Tiny({ label, value }: { label: string; value: string }) {
  return (
    <Box p="xs" bg="var(--mantine-color-default)" style={{ borderRadius: 8 }}>
      <Text
        ff="monospace"
        size="xs"
        c="dimmed"
        tt="uppercase"
        mb={4}
        style={{ letterSpacing: "0.06em" }}
      >
        {label}
      </Text>
      <Text ff="monospace" size="sm">
        {value}
      </Text>
    </Box>
  )
}
