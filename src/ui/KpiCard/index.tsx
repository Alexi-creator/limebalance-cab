import { ActionIcon, Badge, Group, Paper, Text } from "@mantine/core"
import { IconRefresh } from "@tabler/icons-react"

interface Props {
  /** Metric title (e.g. "Income for the month") */
  label: string
  /** Main value displayed in large font */
  value: string
  /** Additional caption under the value */
  sub?: string
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
export function KpiCard({ label, value, sub, trend, accent, onRefresh, isRefreshing }: Props) {
  return (
    <Paper p="lg">
      <Group justify="space-between" align="flex-start">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Group gap={6}>
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
      {sub && (
        <Text size="xs" c="dimmed" mt={4}>
          {sub}
        </Text>
      )}
    </Paper>
  )
}
