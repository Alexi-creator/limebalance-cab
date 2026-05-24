import { Box, Group, Paper, SegmentedControl, Stack, Text } from "@mantine/core"
import { useState } from "react"

const accent = "var(--mantine-color-lime-4)"
const neg = "var(--mantine-color-red-5)"

const datasets: Record<string, { income: number[]; expense: number[]; labels: string[] }> = {
  "1м": {
    income: [42, 56, 38, 71, 64, 82, 75],
    expense: [28, 30, 22, 40, 36, 48, 42],
    labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  },
  "6м": {
    income: [180, 196, 210, 218, 245, 280],
    expense: [120, 138, 140, 148, 160, 180],
    labels: ["Дек", "Янв", "Фев", "Мар", "Апр", "Май"],
  },
  "1г": {
    income: [180, 196, 188, 210, 224, 232, 218, 245, 258, 242, 280, 310],
    expense: [120, 138, 128, 140, 156, 152, 148, 160, 172, 165, 180, 188],
    labels: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
  },
}

export function CashflowChart() {
  const [period, setPeriod] = useState("6м")
  const d = datasets[period]

  const W = 640,
    H = 240,
    PAD_L = 30,
    PAD_R = 10,
    PAD_T = 10,
    PAD_B = 30
  const max = Math.max(...d.income, ...d.expense) * 1.1
  const x = (i: number) => PAD_L + i * ((W - PAD_L - PAD_R) / (d.income.length - 1))
  const y = (v: number) => H - PAD_B - (v / max) * (H - PAD_B - PAD_T)
  const linePath = (arr: number[]) =>
    arr.map((v, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ")
  const areaPath = (arr: number[]) =>
    `${linePath(arr)} L ${x(arr.length - 1).toFixed(1)} ${H - PAD_B} L ${x(0).toFixed(1)} ${H - PAD_B} Z`

  return (
    <Paper>
      <Group
        justify="space-between"
        p="md"
        style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
      >
        <Stack gap={2}>
          <Text fw={600} size="sm">
            Денежный поток
          </Text>
          <Text size="xs" c="dimmed">
            Доходы и расходы по периодам
          </Text>
        </Stack>
        <SegmentedControl size="xs" value={period} onChange={setPeriod} data={["1м", "6м", "1г"]} />
      </Group>
      <Box p="md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: 240, display: "block" }}
          role="img"
          aria-label="Денежный поток"
        >
          <title>Денежный поток</title>
          <defs>
            <linearGradient id="ovIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const yy = PAD_T + (H - PAD_T - PAD_B) * t
            return (
              <g key={t}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={yy}
                  y2={yy}
                  stroke="var(--mantine-color-default-border)"
                  strokeDasharray={t === 1 ? "0" : "2 4"}
                />
                <text
                  x={PAD_L - 6}
                  y={yy + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--mantine-color-dimmed)"
                  fontFamily="var(--mantine-font-family-monospace)"
                >
                  {Math.round(max * (1 - t))}
                </text>
              </g>
            )
          })}
          <path d={areaPath(d.income)} fill="url(#ovIn)" />
          <path
            d={linePath(d.expense)}
            stroke={neg}
            strokeWidth="1.5"
            fill="none"
            opacity="0.7"
            strokeDasharray="3 3"
          />
          <path d={linePath(d.income)} stroke={accent} strokeWidth="2" fill="none" />
          {d.income.map((v, i) => (
            <g key={d.labels[i]}>
              <circle
                cx={x(i)}
                cy={y(v)}
                r="3"
                fill="var(--mantine-color-body)"
                stroke={accent}
                strokeWidth="2"
              />
              <text
                x={x(i)}
                y={H - 10}
                textAnchor="middle"
                fontSize="10"
                fill="var(--mantine-color-dimmed)"
                fontFamily="var(--mantine-font-family-monospace)"
              >
                {d.labels[i]}
              </text>
            </g>
          ))}
        </svg>
        <Group gap="lg" mt="sm">
          <Group gap={6}>
            <Box w={10} h={10} style={{ background: accent, borderRadius: 2 }} />
            <Text size="xs">Доходы</Text>
          </Group>
          <Group gap={6}>
            <Box w={10} h={0} style={{ borderTop: `2px dashed ${neg}` }} />
            <Text size="xs">Расходы</Text>
          </Group>
        </Group>
      </Box>
    </Paper>
  )
}
