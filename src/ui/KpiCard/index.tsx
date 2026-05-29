import { ActionIcon, Badge, Group, Paper, Text } from "@mantine/core"
import { IconRefresh } from "@tabler/icons-react"

interface Props {
  /** Заголовок метрики (например, «Доходы за месяц») */
  label: string
  /** Основное значение, отображаемое крупным шрифтом */
  value: string
  /** Дополнительная подпись под значением */
  sub?: string
  /** Процентное изменение: положительное — зелёный badge ↑, отрицательное — красный ↓ */
  trend?: number
  /** Цвет основного значения (CSS-переменная или цвет Mantine) */
  accent?: string
  /** Если передан — показывает кнопку обновления */
  onRefresh?: () => void
  /** Включает анимацию загрузки на кнопке обновления */
  isRefreshing?: boolean
}

/**
 * Карточка KPI-метрики для дашборда.
 * Отображает заголовок, крупное значение, опциональную подпись, badge тренда и кнопку обновления.
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
