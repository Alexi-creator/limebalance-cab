import { KpiCard } from "@components/KpiCard"
import {
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core"
import { IconDownload } from "@tabler/icons-react"
import { useState } from "react"

const accent = "var(--mantine-color-lime-4)"

const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]
const inc = [180, 196, 188, 210, 224, 232, 218, 245, 258, 242, 280, 310]
const exp = [120, 138, 128, 140, 156, 152, 148, 160, 172, 165, 180, 188]
const MAX = 340

const categories = [
  { name: "Жильё", v: 32400, pct: 25, c: accent, prev: 33800 },
  { name: "Еда дома", v: 22600, pct: 18, c: "var(--mantine-color-green-5)", prev: 19800 },
  { name: "Кафе", v: 14800, pct: 12, c: "var(--mantine-color-yellow-5)", prev: 16400 },
  { name: "Транспорт", v: 12200, pct: 10, c: "var(--mantine-color-blue-5)", prev: 10100 },
  { name: "Развлечения", v: 9800, pct: 8, c: "var(--mantine-color-red-5)", prev: 8900 },
  { name: "Подписки", v: 6400, pct: 5, c: "var(--mantine-color-grape-5)", prev: 6200 },
  { name: "Здоровье", v: 8200, pct: 6, c: "var(--mantine-color-cyan-5)", prev: 7100 },
  { name: "Прочее", v: 21920, pct: 16, c: "var(--mantine-color-dimmed)", prev: 18200 },
]

export function AnalyticsPage() {
  const [period, setPeriod] = useState("Месяц")

  const W = 720,
    H = 300
  const barX = (i: number) => 40 + i * ((W - 50) / 11)

  const R = 60,
    CX = 80,
    CY = 80
  const circ = 2 * Math.PI * R
  let donutOffset = 0

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Аналитика
          </Title>
          <Text size="sm" c="dimmed">
            Куда уходят деньги и как растут накопления
          </Text>
        </Stack>
        <Group gap="xs">
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            data={["Неделя", "Месяц", "Квартал", "Год"]}
          />
          <Button variant="default" size="sm" leftSection={<IconDownload size={14} />}>
            PDF
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <KpiCard
          label="Доходы"
          value="+1 248 320 ₽"
          sub="за 12 месяцев"
          trend={8.4}
          accent="var(--mantine-color-green-5)"
        />
        <KpiCard
          label="Расходы"
          value="-928 600 ₽"
          sub="всего"
          trend={-2.1}
          accent="var(--mantine-color-red-5)"
        />
        <KpiCard
          label="Накоплено"
          value="+319 720 ₽"
          sub="25.6% от дохода"
          trend={32.5}
          accent={accent}
        />
        <KpiCard label="Cash-flow" value="среднее +26 643 ₽" sub="в месяц" trend={14.3} />
      </SimpleGrid>

      <Paper>
        <Group
          justify="space-between"
          p="md"
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
        >
          <Stack gap={2}>
            <Text fw={600} size="sm">
              Доходы vs расходы
            </Text>
            <Text size="xs" c="dimmed">
              {period === "Год" ? "12 месяцев" : period.toLowerCase()}
            </Text>
          </Stack>
          <Group gap="lg">
            <Group gap={6}>
              <Box w={10} h={10} style={{ background: accent, borderRadius: 2 }} />
              <Text size="xs">Доходы</Text>
            </Group>
            <Group gap={6}>
              <Box
                w={10}
                h={10}
                style={{
                  background: "var(--mantine-color-default-hover)",
                  border: "1px solid var(--mantine-color-default-border)",
                  borderRadius: 2,
                }}
              />
              <Text size="xs">Расходы</Text>
            </Group>
          </Group>
        </Group>
        <Box p="md">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: 280, display: "block" }}
            role="img"
            aria-label="График доходов и расходов по месяцам"
          >
            <title>График доходов и расходов по месяцам</title>
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const yy = 20 + 240 * t
              return (
                <g key={t}>
                  <line
                    x1="40"
                    x2={W - 10}
                    y1={yy}
                    y2={yy}
                    stroke="var(--mantine-color-default-border)"
                    strokeDasharray={t === 1 ? "0" : "2 4"}
                  />
                  <text
                    x="34"
                    y={yy + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="var(--mantine-color-dimmed)"
                    fontFamily="var(--mantine-font-family-monospace)"
                  >
                    {Math.round(MAX * (1 - t))}k
                  </text>
                </g>
              )
            })}
            {inc.map((v, i) => {
              const cx = barX(i)
              const hIn = (v / MAX) * 240
              const hOut = (exp[i] / MAX) * 240
              return (
                <g key={months[i]}>
                  <rect x={cx - 10} y={260 - hIn} width="9" height={hIn} rx="2" fill={accent} />
                  <rect
                    x={cx + 1}
                    y={260 - hOut}
                    width="9"
                    height={hOut}
                    rx="2"
                    fill="var(--mantine-color-default-hover)"
                    stroke="var(--mantine-color-default-border)"
                  />
                  <text
                    x={cx}
                    y="280"
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--mantine-color-dimmed)"
                    fontFamily="var(--mantine-font-family-monospace)"
                  >
                    {months[i]}
                  </text>
                </g>
              )
            })}
          </svg>
        </Box>
      </Paper>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper>
            <Group
              justify="space-between"
              p="md"
              style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
            >
              <Text fw={600} size="sm">
                Расходы по категориям
              </Text>
              <Text size="xs" c="dimmed">
                Май 2026
              </Text>
            </Group>
            <Group p="md" gap="lg" wrap="wrap" align="center">
              <svg
                width="160"
                height="160"
                viewBox="0 0 160 160"
                aria-label="Диаграмма расходов по категориям"
                role="img"
              >
                {categories.map((s) => {
                  const off = (donutOffset / 100) * circ
                  const len = (s.pct / 100) * circ
                  donutOffset += s.pct
                  return (
                    <circle
                      key={s.name}
                      cx={CX}
                      cy={CY}
                      r={R}
                      fill="none"
                      stroke={s.c}
                      strokeWidth="18"
                      strokeDasharray={`${len} ${circ - len}`}
                      strokeDashoffset={-off}
                      transform={`rotate(-90 ${CX} ${CY})`}
                    />
                  )
                })}
                <text
                  x="80"
                  y="78"
                  textAnchor="middle"
                  fontSize="20"
                  fill="currentColor"
                  fontFamily="var(--mantine-font-family-monospace)"
                  fontWeight="500"
                >
                  128k
                </text>
                <text
                  x="80"
                  y="94"
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  расход
                </text>
              </svg>
              <Stack gap={4} style={{ flex: 1, minWidth: 200 }}>
                {categories.map((c) => (
                  <Group key={c.name} justify="space-between" gap="xs">
                    <Group gap={8}>
                      <Box w={8} h={8} style={{ background: c.c, borderRadius: 2 }} />
                      <Text size="sm">{c.name}</Text>
                    </Group>
                    <Group gap="xs">
                      <Text ff="monospace" size="sm">
                        {c.v.toLocaleString("ru-RU")} ₽
                      </Text>
                      <Text ff="monospace" size="xs" c="dimmed" w={30} ta="right">
                        {c.pct}%
                      </Text>
                    </Group>
                  </Group>
                ))}
              </Stack>
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper>
            <Group
              justify="space-between"
              p="md"
              style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
            >
              <Text fw={600} size="sm">
                Сравнение с прошлым месяцем
              </Text>
              <Text size="xs" c="dimmed">
                Куда стали тратить больше
              </Text>
            </Group>
            <Stack gap={0} p="md">
              {categories.map((c, i) => {
                const delta = c.v - c.prev
                const up = delta > 0
                const pct = Math.round((delta / c.prev) * 100)
                return (
                  <Box
                    key={c.name}
                    py="sm"
                    style={{
                      borderBottom:
                        i < categories.length - 1
                          ? "1px solid var(--mantine-color-default-border)"
                          : "none",
                    }}
                  >
                    <Group justify="space-between" mb={6}>
                      <Text size="sm">{c.name}</Text>
                      <Badge color={up ? "red" : "green"} variant="light" size="sm">
                        {up ? "↑" : "↓"} {Math.abs(pct)}%
                      </Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text ff="monospace" size="xs" c="dimmed">
                        {c.prev.toLocaleString("ru-RU")} ₽
                      </Text>
                      <Text ff="monospace" size="xs" c={up ? "red.5" : "green.5"}>
                        {up ? "+" : ""}
                        {delta.toLocaleString("ru-RU")} ₽
                      </Text>
                      <Text ff="monospace" size="xs" c="dimmed">
                        {c.v.toLocaleString("ru-RU")} ₽
                      </Text>
                    </Group>
                  </Box>
                )
              })}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
