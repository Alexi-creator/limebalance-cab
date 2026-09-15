import { ActionIcon, Badge, Group, Paper, Text } from "@mantine/core"
import { IconRefresh } from "@tabler/icons-react"
import type { ReactNode } from "react"

interface Props {
  /** Metric title (e.g. "Income for the month") */
  label: string
  /** Main value displayed in large font */
  value: string
  /** Caption under the value. An array renders one line per entry — used by the balance card,
   *  which has to say both what is held in each currency and what is out working. */
  sub?: string | string[]
  /** Attention marker for the card's top-right controls, next to the trend badge and the refresh
   *  button. Lives in the header rather than under the value so that a card with something to say
   *  stays exactly as tall as the cards beside it. */
  alert?: ReactNode
  /** Percentage change: positive — green badge ↑, negative — red ↓ */
  trend?: number
  /** Color of the main value (CSS variable or Mantine color) */
  accent?: string
  /** If provided — shows a refresh button */
  onRefresh?: () => void
  /** Enables the loading animation on the refresh button */
  isRefreshing?: boolean
}

/**
 * KPI metric card for the dashboard.
 * Displays a title, large value, optional caption, trend badge, and refresh button.
 */
export function KpiCard({
  label,
  value,
  sub,
  alert,
  trend,
  accent,
  onRefresh,
  isRefreshing,
}: Props) {
  return (
    <Paper p="lg">
      <Group justify="space-between" align="flex-start">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Group gap={6}>
          {alert}
          {trend != null && (
            <Badge color={trend > 0 ? "green" : "red"} variant="light" size="sm">
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </Badge>
          )}
          {onRefresh && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              loading={isRefreshing}
              onClick={onRefresh}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          )}
        </Group>
      </Group>
      <Text ff="monospace" fz={28} fw={500} mt="sm" c={accent} style={{ letterSpacing: "-0.02em" }}>
        {value}
      </Text>
      {(Array.isArray(sub) ? sub : sub ? [sub] : []).map((line, i) => (
        <Text key={line} size="xs" c="dimmed" mt={i === 0 ? 4 : 2}>
          {line}
        </Text>
      ))}
    </Paper>
  )
}
