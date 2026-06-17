import { Badge, Box, Group, Paper, Stack, Text } from "@mantine/core"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"
import type { CategoryDelta } from "../helpers"

interface Props {
  rows: CategoryDelta[]
  title: string
  subtitle: string
  /** Базовая валюта пользователя — в ней приходят суммы из сводок. */
  baseCurrency?: string
}

/** Список категорий с наибольшим изменением расходов относительно прошлого периода. */
export function CategoryComparison({ rows, title, subtitle, baseCurrency }: Props) {
  const { t, i18n } = useTranslation()
  const money = (n: number) => formatCurrency(n, i18n.language, baseCurrency)
  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Text fw={600} size="sm">
          {title}
        </Text>

        <Text size="xs" c="dimmed">
          {subtitle}
        </Text>
      </Group>
      {rows.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          {t("analytics.comparison_empty")}
        </Text>
      ) : (
        <Stack gap={0} p="md">
          {rows.map((c, i) => {
            const up = c.delta > 0
            return (
              <Box
                key={c.id}
                py="sm"
                style={{
                  borderBottom:
                    i < rows.length - 1 ? "1px solid var(--mantine-color-default-border)" : "none",
                }}
              >
                <Group justify="space-between" mb={6}>
                  <Text size="sm">{c.name}</Text>
                  {c.pct != null && (
                    <Badge color={up ? "red" : "green"} variant="light" size="sm">
                      {up ? "↑" : "↓"} {Math.abs(c.pct)}%
                    </Badge>
                  )}
                </Group>

                <Group justify="space-between">
                  <Text ff="monospace" size="xs" c="dimmed">
                    {money(c.prev)}
                  </Text>
                  <Text ff="monospace" size="xs" c={up ? "red.5" : "green.5"}>
                    {up ? "+" : "−"}
                    {money(Math.abs(c.delta))}
                  </Text>
                  <Text ff="monospace" size="xs" c="dimmed">
                    {money(c.cur)}
                  </Text>
                </Group>
              </Box>
            )
          })}
        </Stack>
      )}
    </Paper>
  )
}
