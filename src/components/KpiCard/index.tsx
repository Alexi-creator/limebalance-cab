import { Badge, Group, Paper, Text } from "@mantine/core"

interface Props {
  label: string
  value: string
  sub?: string
  trend?: number
  accent?: string
}

export function KpiCard({ label, value, sub, trend, accent }: Props) {
  return (
    <Paper p="lg">
      <Group justify="space-between" align="flex-start">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        {trend != null && (
          <Badge color={trend > 0 ? "green" : "red"} variant="light" size="sm">
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </Badge>
        )}
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
