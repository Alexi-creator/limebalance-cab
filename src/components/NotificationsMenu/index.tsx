import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@api/notifications"
import type { AppNotification, NotificationsResponse } from "@appTypes/notification"
import {
  monthlyDigestPayloadSchema,
  monthlySummaryPayloadSchema,
  tradeClosedPayloadSchema,
} from "@appTypes/notification"
import { NOTIFICATIONS_STALE_TIME, notificationKeys } from "@constants/queries/notifications"
import { dateFnsLocales } from "@i18n/languages.ts"
import {
  ActionIcon,
  Box,
  Group,
  Indicator,
  Menu,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core"
import {
  IconArrowsExchange,
  IconBell,
  IconCalendarStats,
  IconReportMoney,
  IconSparkles,
  IconTargetArrow,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatCurrency } from "@utils/formatCurrency"
import type { Locale } from "date-fns"
import { format, formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

/** Icon per notification `type`, with a sensible fallback for unknown/new kinds. */
const TYPE_ICON: Record<string, typeof IconBell> = {
  monthly_summary: IconReportMoney,
  monthly_digest: IconCalendarStats,
  goal_completed: IconTargetArrow,
  news: IconSparkles,
}

const TYPE_COLOR: Record<string, string> = {
  monthly_summary: "lime",
  monthly_digest: "indigo",
  goal_completed: "green",
  news: "grape",
}

/** Capitalizes the first letter (month names are lowercase in several locales). */
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Icon/color for a notification row. `trade_closed` reflects win/loss (green/red), mirroring the
 *  🟢/🔴 the Telegram bot puts on the same event, instead of a single static color like other types. */
function getTypeVisual(n: AppNotification): { Icon: typeof IconBell; color: string } {
  if (n.type === "trade_closed") {
    const parsed = tradeClosedPayloadSchema.safeParse(n.payload)
    if (parsed.success) {
      return parsed.data.closedPnl >= 0
        ? { Icon: IconTrendingUp, color: "green" }
        : { Icon: IconTrendingDown, color: "red" }
    }
    return { Icon: IconArrowsExchange, color: "blue" }
  }
  return { Icon: TYPE_ICON[n.type] ?? IconBell, color: TYPE_COLOR[n.type] ?? "gray" }
}

/**
 * Localized title/body for a notification, keyed by `type` via the convention
 * `notifications.<type>.{title,body}`. New simple types need only locale strings — no code here.
 *
 * `monthly_summary`, `monthly_digest`, and `trade_closed` are exceptions: they need real
 * client-side work (month name from `period`, prior-month percent change, signed PnL/ROI
 * formatting) that a plain interpolated string can't do, so they get dedicated branches.
 * Anything without a matching template falls back to the server-rendered `title`/`body`.
 */
function renderNotification(
  n: AppNotification,
  t: ReturnType<typeof useTranslation>["t"],
  i18n: ReturnType<typeof useTranslation>["i18n"],
  locale: Locale,
): { title: string; message: string } {
  if (n.type === "monthly_summary") {
    const parsed = monthlySummaryPayloadSchema.safeParse(n.payload)
    if (parsed.success) {
      const p = parsed.data
      const [year, month] = p.period.split("-").map(Number)
      const monthName = capitalize(format(new Date(year, month - 1, 1), "LLLL", { locale }))
      const fmt = (v: number | null) =>
        v === null ? "—" : formatCurrency(v, i18n.language, p.baseCurrency)

      let message =
        p.net !== null
          ? t("notifications.monthly_summary.body_net", {
              month: monthName,
              income: fmt(p.income),
              expense: fmt(p.expense),
              net: fmt(p.net),
            })
          : t("notifications.monthly_summary.body", {
              month: monthName,
              income: fmt(p.income),
              expense: fmt(p.expense),
            })

      if (p.topCategory) {
        const emoji = p.topCategory.emoji ? `${p.topCategory.emoji} ` : ""
        message += ` ${t("notifications.monthly_summary.top_category", {
          category: `${emoji}${p.topCategory.name}`,
        })}`
      }

      return { title: t("notifications.monthly_summary.title"), message }
    }
  }

  if (n.type === "monthly_digest") {
    const parsed = monthlyDigestPayloadSchema.safeParse(n.payload)
    if (parsed.success) {
      const p = parsed.data
      const [year, month] = p.period.split("-").map(Number)
      const monthName = capitalize(format(new Date(year, month - 1, 1), "LLLL", { locale }))
      const fmt = (v: number | null) =>
        v === null ? "—" : formatCurrency(v, i18n.language, p.baseCurrency)
      const signed = (v: number, digits = 2) => `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`
      // Null when there's nothing meaningful to compare against — mirrors the backend's
      // formatPercentChange in monthly-digest.service.ts, so the two stay in sync.
      const pctChange = (current: number | null, baseline: number | null) => {
        if (current === null || baseline === null || baseline === 0) return null
        return `${signed(((current - baseline) / Math.abs(baseline)) * 100, 1)}%`
      }

      const parts: string[] = []
      if (p.income !== null) {
        const change = pctChange(p.income, p.baselineIncome)
        parts.push(
          `${t("notifications.monthly_digest.income")}: ${fmt(p.income)}` +
            (change ? ` (${change} ${t("notifications.monthly_digest.vs_prev_month")})` : ""),
        )
      }
      if (p.expense !== null) {
        const change = pctChange(p.expense, p.baselineExpense)
        parts.push(
          `${t("notifications.monthly_digest.expense")}: ${fmt(p.expense)}` +
            (change ? ` (${change} ${t("notifications.monthly_digest.vs_prev_month")})` : ""),
        )
      }
      if (p.net !== null) parts.push(`${t("notifications.monthly_digest.net")}: ${fmt(p.net)}`)
      if (p.income && p.income > 0 && p.net !== null) {
        parts.push(
          `${t("notifications.monthly_digest.savings_rate")}: ${((p.net / p.income) * 100).toFixed(1)}%`,
        )
      }
      if (p.topCategory) {
        const emoji = p.topCategory.emoji ? `${p.topCategory.emoji} ` : ""
        parts.push(
          `${t("notifications.monthly_digest.top_category")}: ${emoji}${p.topCategory.name}`,
        )
      }
      if (p.biggestExpense) {
        const emoji = p.biggestExpense.emoji ? `${p.biggestExpense.emoji} ` : ""
        parts.push(
          `${t("notifications.monthly_digest.biggest_expense")}: ${emoji}${p.biggestExpense.category} — ${fmt(p.biggestExpense.amount)}`,
        )
      }
      if (p.goalsContributed !== null && p.goalsContributed > 0) {
        parts.push(
          `${t("notifications.monthly_digest.goals_contributed")}: ${fmt(p.goalsContributed)}`,
        )
      }
      if (p.goalsCompleted > 0) {
        parts.push(`${t("notifications.monthly_digest.goals_completed")}: ${p.goalsCompleted}`)
      }
      if (p.investingPnl !== null) {
        parts.push(
          `${t("notifications.monthly_digest.investing_pnl")}: ${signed(p.investingPnl)} USDT`,
        )
      }

      return {
        title: t("notifications.monthly_digest.title", { month: monthName }),
        message: parts.join(" · "),
      }
    }
  }

  if (n.type === "trade_closed") {
    const parsed = tradeClosedPayloadSchema.safeParse(n.payload)
    if (parsed.success) {
      const p = parsed.data
      const direction = t(p.direction === "long" ? "investments.pos_long" : "investments.pos_short")
      const signed = (v: number, digits: number) => `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`
      return {
        title: t("notifications.trade_closed.title"),
        message: t("notifications.trade_closed.body", {
          symbol: p.symbol,
          direction,
          pnl: `${signed(p.closedPnl, 2)} USDT`,
          roi: `${signed(p.roiPercent, 1)}%`,
        }),
      }
    }
  }

  // Convention-based lookup: render from `notifications.<type>.{title,body}` if a template exists,
  // interpolating the payload (user data like `name` is passed through untranslated).
  const titleKey = `notifications.${n.type}.title`
  if (i18n.exists(titleKey)) {
    const values: Record<string, unknown> =
      n.payload && typeof n.payload === "object" ? (n.payload as Record<string, unknown>) : {}
    const bodyKey = `notifications.${n.type}.body`
    return {
      title: t(titleKey, values),
      message: i18n.exists(bodyKey) ? t(bodyKey, values) : (n.body ?? ""),
    }
  }

  return { title: n.title ?? "", message: n.body ?? "" }
}

/** Bell in the header with a dropdown of in-app notifications and an unread indicator. */
export function NotificationsMenu() {
  const { t, i18n } = useTranslation()
  const locale = dateFnsLocales[i18n.language] ?? enUS
  const queryClient = useQueryClient()

  // No refetch on open: data is refreshed by invalidation when goals change, and otherwise
  // only goes stale once per half-day (see NOTIFICATIONS_STALE_TIME) to avoid hitting the
  // server's expensive summary recompute on every interaction.
  const { data } = useQuery({
    queryKey: notificationKeys.all,
    queryFn: getNotifications,
    staleTime: NOTIFICATIONS_STALE_TIME,
  })

  const notifications = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0

  const rendered = useMemo(
    () =>
      notifications.map((n) => ({
        notification: n,
        ...renderNotification(n, t, i18n, locale),
      })),
    [notifications, t, i18n, i18n.language, locale],
  )

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      const prev = queryClient.getQueryData<NotificationsResponse>(notificationKeys.all)
      queryClient.setQueryData<NotificationsResponse>(notificationKeys.all, (old) =>
        old
          ? {
              items: old.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
              unreadCount: old.items.find((n) => n.id === id && !n.isRead)
                ? Math.max(0, old.unreadCount - 1)
                : old.unreadCount,
            }
          : old,
      )
      return { prev }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notificationKeys.all, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      const prev = queryClient.getQueryData<NotificationsResponse>(notificationKeys.all)
      queryClient.setQueryData<NotificationsResponse>(notificationKeys.all, (old) =>
        old ? { items: old.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 } : old,
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(notificationKeys.all, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })

  const onItemClick = (n: AppNotification) => {
    if (!n.isRead) markRead.mutate(n.id)
  }

  return (
    <Menu position="bottom-end" width={340} shadow="md" withArrow>
      <Menu.Target>
        <Indicator
          color="lime"
          size={unreadCount > 0 ? 16 : 8}
          offset={unreadCount > 0 ? 4 : 6}
          processing
          disabled={unreadCount === 0}
          label={unreadCount > 0 ? unreadCount : undefined}
        >
          <ActionIcon variant="default" size={36} aria-label={t("common.notifications")}>
            <IconBell size={18} />
          </ActionIcon>
        </Indicator>
      </Menu.Target>

      <Menu.Dropdown p={0}>
        <Group justify="space-between" px="sm" py="xs">
          <Text fw={600} size="sm">
            {t("common.notifications")}
          </Text>
          {unreadCount > 0 && (
            <UnstyledButton onClick={() => markAllRead.mutate()}>
              <Text size="xs" c="lime.7">
                {t("notifications.mark_all_read")}
              </Text>
            </UnstyledButton>
          )}
        </Group>

        <Menu.Divider m={0} />

        {rendered.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" py="xl">
            {t("notifications.empty")}
          </Text>
        ) : (
          <ScrollArea.Autosize mah={360}>
            {rendered.map(({ notification: n, title, message }) => {
              const { Icon, color } = getTypeVisual(n)
              return (
                <UnstyledButton
                  key={n.id}
                  onClick={() => onItemClick(n)}
                  display="block"
                  w="100%"
                  px="sm"
                  py="xs"
                  style={{
                    borderBottom: "1px solid var(--mantine-color-default-border)",
                    background: n.isRead ? undefined : "var(--mantine-color-default-hover)",
                  }}
                >
                  <Group gap="sm" wrap="nowrap" align="flex-start">
                    <ThemeIcon variant="light" color={color} size={34} radius="md">
                      <Icon size={18} />
                    </ThemeIcon>
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" gap="xs" wrap="nowrap">
                        <Text size="sm" fw={n.isRead ? 500 : 600} truncate>
                          {title}
                        </Text>
                        {!n.isRead && (
                          <Box
                            w={8}
                            h={8}
                            style={{
                              borderRadius: "50%",
                              background: "var(--mantine-color-lime-6)",
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {message}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {formatDistanceToNow(n.createdAt, { addSuffix: true, locale })}
                      </Text>
                    </Stack>
                  </Group>
                </UnstyledButton>
              )
            })}
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}
