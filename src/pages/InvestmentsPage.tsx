import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core"
import {
  IconArrowDown,
  IconArrowUp,
  IconDotsVertical,
  IconFilter,
  IconPlus,
} from "@tabler/icons-react"
import { useState } from "react"

const accent = "var(--mantine-color-lime-4)"

interface Holding {
  sym: string
  name: string
  amount: string
  value: number
  chg: number
  alloc: number
  avg: number
  c: string
}

const PORTFOLIO: Holding[] = [
  {
    sym: "BTC",
    name: "Bitcoin",
    amount: "0.184",
    value: 12589,
    chg: 2.4,
    alloc: 38,
    avg: 58200,
    c: accent,
  },
  {
    sym: "ETH",
    name: "Ethereum",
    amount: "2.46",
    value: 7990,
    chg: 1.2,
    alloc: 24,
    avg: 2900,
    c: "var(--mantine-color-green-5)",
  },
  {
    sym: "USDT",
    name: "Tether",
    amount: "5 940",
    value: 5940,
    chg: 0.0,
    alloc: 18,
    avg: 1.0,
    c: "var(--mantine-color-dimmed)",
  },
  {
    sym: "SOL",
    name: "Solana",
    amount: "22.1",
    value: 4031,
    chg: -0.8,
    alloc: 12,
    avg: 142,
    c: "var(--mantine-color-yellow-5)",
  },
  {
    sym: "TON",
    name: "Toncoin",
    amount: "420",
    value: 2452,
    chg: 4.1,
    alloc: 8,
    avg: 4.8,
    c: "var(--mantine-color-red-5)",
  },
]

const WATCHLIST = [
  { sym: "ARB", name: "Arbitrum", price: 0.84, chg: 5.2, up: true },
  { sym: "AVAX", name: "Avalanche", price: 32.5, chg: 1.8, up: true },
  { sym: "DOGE", name: "Dogecoin", price: 0.14, chg: 8.2, up: true },
  { sym: "ADA", name: "Cardano", price: 0.42, chg: -2.0, up: false },
  { sym: "DOT", name: "Polkadot", price: 6.18, chg: -1.4, up: false },
]

const ALERTS = [
  {
    sym: "BTC",
    cond: "When the price ≥ $72 000",
    s: "active" as const,
    up: true,
    c: "green" as const,
  },
  {
    sym: "ETH",
    cond: "When the price ≤ $3 100",
    s: "active" as const,
    up: false,
    c: "red" as const,
  },
  {
    sym: "SOL",
    cond: "24h change > 10%",
    s: "active" as const,
    up: true,
    c: "lime" as const,
  },
  { sym: "TON", cond: "Price broke $6.00", s: "fired" as const, up: true, c: "gray" as const },
]

export function InvestmentsPage() {
  const [range, setRange] = useState("1M")

  const points = [28200, 28800, 27500, 29100, 30200, 31800, 31200, 32400, 33002]
  const W = 720,
    H = 240,
    PAD = 20
  const min = Math.min(...points) * 0.98
  const max = Math.max(...points) * 1.02
  const x = (i: number) => PAD + i * ((W - PAD * 2) / (points.length - 1))
  const y = (v: number) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2)
  const linePath = points.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ")
  const areaPath = `${linePath} L ${x(points.length - 1)} ${H - PAD} L ${PAD} ${H - PAD} Z`

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Investments and crypto
          </Title>
          <Text size="sm" c="dimmed">
            Portfolio of 5 assets · updated just now
          </Text>
        </Stack>
        <Group gap="xs">
          <Button variant="default" size="sm">
            Connect wallet
          </Button>
          <Button size="sm" leftSection={<IconPlus size={14} />}>
            Buy
          </Button>
        </Group>
      </Group>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Paper>
            <Group
              justify="space-between"
              p="md"
              align="flex-start"
              style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
            >
              <Stack gap={2}>
                <Text size="xs" c="dimmed">
                  Portfolio value
                </Text>
                <Group align="baseline" gap="xs">
                  <Text ff="monospace" fz={32} fw={500} style={{ letterSpacing: "-0.02em" }}>
                    $33 002
                  </Text>
                  <Text size="sm" c="dimmed">
                    ≈ 3 048 685 ₽
                  </Text>
                </Group>
                <Text size="sm" c="green.5">
                  +$1 248 (+3.92%) {range}
                </Text>
              </Stack>
              <SegmentedControl
                size="xs"
                value={range}
                onChange={setRange}
                data={["24h", "1W", "1M", "3M", "1Y", "All"]}
              />
            </Group>
            <Box p="md">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                style={{ width: "100%", height: 220, display: "block" }}
                role="img"
                aria-label="Portfolio value chart"
              >
                <title>Portfolio value chart</title>
                <defs>
                  <linearGradient id="invG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                  <line
                    key={t}
                    x1={PAD}
                    x2={W - PAD}
                    y1={PAD + (H - PAD * 2) * t}
                    y2={PAD + (H - PAD * 2) * t}
                    stroke="var(--mantine-color-default-border)"
                    strokeDasharray={t === 1 ? "0" : "2 4"}
                  />
                ))}
                <path d={areaPath} fill="url(#invG)" />
                <path d={linePath} stroke={accent} strokeWidth="2" fill="none" />
                <circle
                  cx={x(points.length - 1)}
                  cy={y(points[points.length - 1])}
                  r="4"
                  fill={accent}
                />
                <circle
                  cx={x(points.length - 1)}
                  cy={y(points[points.length - 1])}
                  r="9"
                  fill={accent}
                  opacity="0.18"
                />
              </svg>
            </Box>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <Paper h="100%">
            <Group
              justify="space-between"
              p="md"
              style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
            >
              <Text fw={600} size="sm">
                Allocation
              </Text>
              <Badge color="blue" variant="light">
                live
              </Badge>
            </Group>
            <Stack p="md" gap="xs">
              <Box
                style={{
                  display: "flex",
                  height: 8,
                  borderRadius: 99,
                  overflow: "hidden",
                  marginBottom: 4,
                }}
              >
                {PORTFOLIO.map((p) => (
                  <Box key={p.sym} style={{ flex: p.alloc, background: p.c }} />
                ))}
              </Box>
              {PORTFOLIO.map((p, i) => (
                <Group
                  key={p.sym}
                  justify="space-between"
                  py={6}
                  style={{
                    borderBottom:
                      i < PORTFOLIO.length - 1
                        ? "1px solid var(--mantine-color-default-border)"
                        : "none",
                  }}
                >
                  <Group gap="xs">
                    <Box w={10} h={10} style={{ background: p.c, borderRadius: 2 }} />
                    <Text size="sm">{p.sym}</Text>
                    <Text size="xs" c="dimmed">
                      {p.name}
                    </Text>
                  </Group>
                  <Text ff="monospace" size="sm" c="dimmed">
                    {p.alloc}%
                  </Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>

      <Paper>
        <Group
          justify="space-between"
          p="md"
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
        >
          <Text fw={600} size="sm">
            Assets
          </Text>
          <Button variant="subtle" size="xs" leftSection={<IconFilter size={14} />}>
            Filters
          </Button>
        </Group>
        <Table verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Asset</Table.Th>
              <Table.Th ta="right">Quantity</Table.Th>
              <Table.Th ta="right">Avg. price</Table.Th>
              <Table.Th ta="right">Value</Table.Th>
              <Table.Th ta="right">24h</Table.Th>
              <Table.Th ta="right">P/L</Table.Th>
              <Table.Th w={120} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {PORTFOLIO.map((p) => {
              const pl = p.value - parseFloat(p.amount.replace(/\s/g, "")) * p.avg
              return (
                <Table.Tr key={p.sym}>
                  <Table.Td>
                    <Group gap="sm">
                      <Box
                        w={32}
                        h={32}
                        style={{
                          borderRadius: 999,
                          background: "var(--mantine-color-default)",
                          border: "1px solid var(--mantine-color-default-border)",
                          display: "grid",
                          placeItems: "center",
                          fontFamily: "var(--mantine-font-family-monospace)",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        {p.sym}
                      </Box>
                      <Stack gap={0}>
                        <Text size="sm">{p.name}</Text>
                        <Text size="xs" c="dimmed">
                          {p.sym}
                        </Text>
                      </Stack>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text ff="monospace" size="sm">
                      {p.amount}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text ff="monospace" size="sm" c="dimmed">
                      ${p.avg}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text ff="monospace" size="sm" fw={500}>
                      ${p.value.toLocaleString("ru-RU")}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text
                      ff="monospace"
                      size="sm"
                      c={p.chg > 0 ? "green.5" : p.chg < 0 ? "red.5" : "dimmed"}
                    >
                      {p.chg > 0 ? "+" : ""}
                      {p.chg}%
                    </Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text ff="monospace" size="sm" c={pl > 0 ? "green.5" : "red.5"}>
                      {pl > 0 ? "+" : ""}${Math.round(pl).toLocaleString("ru-RU")}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <Button variant="subtle" size="compact-xs">
                        Buy
                      </Button>
                      <Button variant="subtle" size="compact-xs">
                        Sell
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <Paper>
          <Group
            justify="space-between"
            p="md"
            style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
          >
            <Text fw={600} size="sm">
              Watchlist
            </Text>
            <Button variant="subtle" size="xs" leftSection={<IconPlus size={14} />}>
              Add
            </Button>
          </Group>
          {WATCHLIST.map((w, i) => (
            <Group
              key={w.sym}
              px="md"
              py="sm"
              wrap="nowrap"
              gap="sm"
              style={{
                borderBottom:
                  i < WATCHLIST.length - 1
                    ? "1px solid var(--mantine-color-default-border)"
                    : "none",
              }}
            >
              <Box
                w={32}
                h={32}
                style={{
                  borderRadius: 999,
                  background: "var(--mantine-color-default-hover)",
                  border: "1px solid var(--mantine-color-default-border)",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--mantine-font-family-monospace)",
                  fontWeight: 600,
                  fontSize: 11,
                }}
              >
                {w.sym}
              </Box>
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm">{w.name}</Text>
                <Text size="xs" c="dimmed">
                  {w.sym}
                </Text>
              </Stack>
              <Text ff="monospace" size="sm">
                ${w.price}
              </Text>
              <Text ff="monospace" size="sm" c={w.up ? "green.5" : "red.5"} w={56} ta="right">
                {w.up ? "+" : ""}
                {w.chg}%
              </Text>
            </Group>
          ))}
        </Paper>

        <Paper>
          <Group
            justify="space-between"
            p="md"
            style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
          >
            <Text fw={600} size="sm">
              Alerts
            </Text>
            <Button variant="subtle" size="xs" leftSection={<IconPlus size={14} />}>
              New
            </Button>
          </Group>
          <Stack gap={0} p="md" pt="xs">
            {ALERTS.map((a, i) => (
              <Group
                key={a.sym}
                py="sm"
                wrap="nowrap"
                gap="sm"
                style={{
                  borderBottom:
                    i < ALERTS.length - 1
                      ? "1px solid var(--mantine-color-default-border)"
                      : "none",
                }}
              >
                <ThemeIcon variant="light" color={a.c} size="lg" radius="md">
                  {a.up ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm">
                    {a.sym}{" "}
                    <Text component="span" c="dimmed">
                      · {a.cond}
                    </Text>
                  </Text>
                  <Text size="xs" c={a.s === "active" ? "green.5" : "dimmed"}>
                    {a.s === "active" ? "● active" : "● fired, off"}
                  </Text>
                </Stack>
                <ActionIcon variant="subtle" size="sm" color="gray">
                  <IconDotsVertical size={14} />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>
    </Stack>
  )
}
