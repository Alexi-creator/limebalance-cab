import { ActionIcon, Badge, Group, Paper, Text } from "@mantine/core"
import { IconRefresh } from "@tabler/icons-react"

interface Props {
  label: string
  value: string
  sub?: string
  trend?: number
  accent?: string
  onRefresh?: () => void
  isRefreshing?: boolean
}

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
