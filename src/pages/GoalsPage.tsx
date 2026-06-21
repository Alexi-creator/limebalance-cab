import { getGoals } from "@api/goals"
import type { Goal } from "@appTypes/goal"
import { AddModal } from "@components/AddModal"
import { GoalForm } from "@components/AddModal/GoalForm"
import { CloseGoalConfirm } from "@components/goals/CloseGoalConfirm"
import { ContributionForm } from "@components/goals/ContributionForm"
import { ContributionsHistory } from "@components/goals/ContributionsHistory"
import { DeleteGoalConfirm } from "@components/goals/DeleteGoalConfirm"
import { GOALS_STALE_TIME, goalKeys } from "@constants/queries/goals"
import { dateFnsLocales } from "@i18n/languages.ts"
import {
  ActionIcon,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { useModalStore } from "@store/modalStore"
import { IconCircleCheck, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import { addMonths, differenceInDays, differenceInMonths, format } from "date-fns"
import { enUS } from "date-fns/locale"
import type { TFunction } from "i18next"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"

/**
 * Progress-bar color (frontend rule, per the spec):
 * red — overdue or under 25%; yellow — close to the deadline (≤ 2 months left, not yet done);
 * green — otherwise.
 */
function goalColor(g: Goal): string {
  if (g.isOverdue || g.progress < 25) return "red"
  if (!g.isCompleted && g.monthsLeft !== null && g.monthsLeft <= 2) return "yellow"
  return "green"
}

/**
 * Time left until the target date as "Xmo Yd". The backend's `monthsLeft` is whole months only
 * (so it reads "0" for anything under a month), so we derive months + remaining days from
 * `targetDate`. Returns "—" for open-ended goals.
 */
function remainingLabel(g: Goal, t: TFunction): string {
  if (g.monthsLeft == null || !g.targetDate) return "—"
  const now = new Date()
  if (g.targetDate <= now) return t("goals.days_value", { count: 0 })

  const months = differenceInMonths(g.targetDate, now)
  const days = differenceInDays(g.targetDate, addMonths(now, months))
  const parts: string[] = []
  if (months > 0) parts.push(t("goals.months_value", { count: months }))
  if (days > 0 || months === 0) parts.push(t("goals.days_value", { count: days }))
  return parts.join(" ")
}

export function GoalsPage() {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const open = useModalStore((s) => s.open)
  const close = useModalStore((s) => s.close)
  const money = (n: number, currency?: string) => formatCurrency(n, i18n.language, currency)
  const dash = (v: number | null | undefined, currency?: string) =>
    v == null ? "—" : money(v, currency)

  const { data, isLoading } = useQuery({
    queryKey: goalKeys.all,
    queryFn: getGoals,
    staleTime: GOALS_STALE_TIME,
  })

  const goals = data?.items ?? []
  const summary = data?.summary
  const overallProgress = summary?.overallProgress ?? null

  const openCreate = () =>
    open({ size: "lg", centered: true, children: <AddModal type="goal" lockType /> })

  // Open the create modal automatically when navigated here from the home snippet's "add goal" button.
  const location = useLocation()
  const navigate = useNavigate()
  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to navigation state changes
  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate()
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.state])

  const openEdit = (goal: Goal) =>
    open({
      size: "lg",
      centered: true,
      title: t("goals.edit_title"),
      children: <GoalForm goal={goal} onSubmit={close} onCancel={close} />,
    })

  const openDeposit = (goal: Goal) =>
    open({ centered: true, title: t("goals.deposit"), children: <ContributionForm goal={goal} /> })

  const openWithdraw = (goal: Goal) =>
    open({
      centered: true,
      title: t("goals.withdraw"),
      children: <ContributionForm goal={goal} initialMode="withdraw" />,
    })

  const openHistory = (goal: Goal) =>
    open({
      centered: true,
      title: t("goals.history_title"),
      children: <ContributionsHistory goal={goal} />,
    })

  const openClose = (goal: Goal) =>
    open({
      centered: true,
      title: goal.isCompleted ? t("goals.completed_title") : t("goals.close_title"),
      children: <CloseGoalConfirm goal={goal} completed={goal.isCompleted} />,
    })

  const openDelete = (goal: Goal) =>
    open({
      centered: true,
      title: t("goals.delete_title"),
      children: <DeleteGoalConfirm goal={goal} />,
    })

  const deadlineLabel = (g: Goal) =>
    g.targetDate
      ? t("goals.until", { deadline: format(g.targetDate, "d MMM yyyy", { locale }) })
      : t("goals.no_deadline")

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            {t("goals.title")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("goals.active_count", { count: summary?.activeCount ?? 0 })}
          </Text>
        </Stack>
        <Button size="sm" leftSection={<IconPlus size={14} />} onClick={openCreate}>
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
              {dash(summary?.totalSaved, summary?.baseCurrency)}{" "}
              <Text component="span" c="dimmed" fz={16}>
                / {dash(summary?.totalTarget, summary?.baseCurrency)}
              </Text>
            </Text>
          </Stack>
          <Box style={{ flex: 1, minWidth: 240, maxWidth: 420 }}>
            <Group justify="space-between" mb={6}>
              <Text size="xs" c="dimmed">
                {t("goals.to_final", { pct: overallProgress ?? "—" })}
              </Text>
              <Text ff="monospace" size="xs" c="dimmed">
                {t("goals.left_amount", {
                  amount: dash(summary?.totalRemaining, summary?.baseCurrency),
                })}
              </Text>
            </Group>
            <Progress
              value={overallProgress ?? 0}
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

      {isLoading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {goals.map((g) => {
            const color = goalColor(g)
            return (
              <Paper key={g.id} p="lg">
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
                      {g.emoji ?? "🎯"}
                    </Box>
                    <Stack gap={2}>
                      <Text fw={600}>{g.name}</Text>
                      <Text size="xs" c="dimmed">
                        {deadlineLabel(g)}
                      </Text>
                    </Stack>
                  </Group>
                  <Group gap={4}>
                    <Tooltip
                      label={g.isCompleted ? t("goals.close_title") : t("goals.close_early")}
                    >
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        color="green"
                        onClick={() => openClose(g)}
                      >
                        <IconCircleCheck size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t("common.change")}>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        color="gray"
                        onClick={() => openEdit(g)}
                      >
                        <IconEdit size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t("common.delete")}>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        color="gray"
                        onClick={() => openDelete(g)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>

                <Group justify="space-between" align="baseline" mb="xs">
                  <Text ff="monospace" fz={24} fw={500} c={`${color}.5`}>
                    {g.progress}%
                  </Text>
                  <Text ff="monospace" size="sm" c="dimmed">
                    {money(g.currentAmount, g.currency)} / {money(g.targetAmount, g.currency)}
                  </Text>
                </Group>
                <Progress value={g.progress} color={color} size="md" mb="md" />

                <SimpleGrid cols={3} spacing="xs">
                  <Tiny label={t("goals.tiny_left")} value={money(g.remaining, g.currency)} />
                  <Tiny
                    label={t("goals.tiny_per_month")}
                    value={g.perMonth == null ? "—" : money(g.perMonth, g.currency)}
                  />
                  <Tiny label={t("goals.tiny_term")} value={remainingLabel(g, t)} />
                </SimpleGrid>

                <Group mt="md" gap="xs" grow>
                  <Button color="green" size="sm" onClick={() => openDeposit(g)}>
                    {t("goals.deposit")}
                  </Button>
                  <Button color="red" size="sm" onClick={() => openWithdraw(g)}>
                    {t("goals.withdraw")}
                  </Button>
                </Group>
                <Button
                  fullWidth
                  variant="outline"
                  color="green.9"
                  size="sm"
                  mt="xs"
                  onClick={() => openHistory(g)}
                >
                  {t("goals.history")}
                </Button>
              </Paper>
            )
          })}

          <Paper
            p="lg"
            onClick={openCreate}
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
      )}
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
