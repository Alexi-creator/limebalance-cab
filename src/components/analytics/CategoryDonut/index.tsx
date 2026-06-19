import { Box, Group, Paper, Stack, Text } from "@mantine/core"
import { formatCurrency } from "@utils/formatCurrency"
import { useTranslation } from "react-i18next"
import type { CategorySlice } from "../helpers"

const R = 60
const CX = 80
const CY = 80
const CIRC = 2 * Math.PI * R

interface Props {
  slices: CategorySlice[]
  title: string
  subtitle: string
  /** User's base currency — the amounts from the summaries come in it. */
  baseCurrency?: string
}

/** Donut chart of expenses by category with a legend. */
export function CategoryDonut({ slices, title, subtitle, baseCurrency }: Props) {
  const { t, i18n } = useTranslation()
  const money = (n: number) => formatCurrency(n, i18n.language, baseCurrency)
  const total = slices.reduce((s, c) => s + c.total, 0)
  let offset = 0

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
      {slices.length === 0 ? (
        <Text c="dimmed" ta="center" p="xl">
          {t("analytics.donut_empty")}
        </Text>
      ) : (
        <Group p="md" gap="lg" wrap="wrap" align="center">
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            aria-label={t("analytics.donut_aria")}
            role="img"
          >
            {slices.map((s) => {
              const off = (offset / 100) * CIRC
              const len = (s.pct / 100) * CIRC
              offset += s.pct
              return (
                <circle
                  key={s.id}
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="18"
                  strokeDasharray={`${len} ${CIRC - len}`}
                  strokeDashoffset={-off}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              )
            })}
            <text
              x="80"
              y="78"
              textAnchor="middle"
              fontSize="18"
              fill="currentColor"
              fontFamily="var(--mantine-font-family-monospace)"
              fontWeight="500"
            >
              {total >= 1000 ? `${Math.round(total / 1000)}k` : Math.round(total)}
            </text>
            <text
              x="80"
              y="94"
              textAnchor="middle"
              fontSize="10"
              fill="var(--mantine-color-dimmed)"
              fontFamily="var(--mantine-font-family-monospace)"
            >
              {t("analytics.donut_center")}
            </text>
          </svg>
          <Stack gap={4} style={{ flex: 1, minWidth: 200 }}>
            {slices.map((c) => (
              <Group key={c.id} justify="space-between" gap="xs">
                <Group gap={8}>
                  <Box w={8} h={8} style={{ background: c.color, borderRadius: 2 }} />
                  <Text size="sm">{c.name}</Text>
                </Group>
                <Group gap="xs">
                  <Text ff="monospace" size="sm">
                    {money(c.total)}
                  </Text>
                  <Text ff="monospace" size="xs" c="dimmed" w={34} ta="right">
                    {c.pct}%
                  </Text>
                </Group>
              </Group>
            ))}
          </Stack>
        </Group>
      )}
    </Paper>
  )
}
