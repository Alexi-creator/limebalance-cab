import { Button, Group, NumberInput, SimpleGrid, Stack, TextInput } from "@mantine/core"
import { useState } from "react"

const POPULAR = ["BTC", "ETH", "SOL", "TON", "USDT", "BNB", "XRP", "DOGE", "ADA", "AVAX"]
const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

interface Props {
  onSubmit: () => void
  onCancel: () => void
}

export function AssetForm({ onSubmit, onCancel }: Props) {
  const [sym, setSym] = useState("")
  const [amount, setAmount] = useState<number | string>("")
  const [avg, setAvg] = useState<number | string>("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (sym && amount) onSubmit()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <TextInput
          label="Тикер актива"
          required
          autoFocus
          placeholder="BTC"
          value={sym}
          onChange={(e) => setSym(e.currentTarget.value.toUpperCase())}
          styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)" } }}
        />
        <Group gap={6}>
          {POPULAR.map((s) => (
            <Button
              key={s}
              type="button"
              size="xs"
              radius="sm"
              variant={sym === s ? "light" : "default"}
              color={sym === s ? "lime" : "gray"}
              onClick={() => setSym(s)}
            >
              {s}
            </Button>
          ))}
        </Group>
        <SimpleGrid cols={2}>
          <NumberInput
            label="Количество"
            required
            min={0}
            placeholder="0.5"
            value={amount}
            onChange={setAmount}
            decimalScale={8}
          />
          <NumberInput
            label="Средняя цена"
            min={0}
            placeholder="68 420"
            value={avg}
            onChange={setAvg}
            prefix="$"
            thousandSeparator=" "
          />
        </SimpleGrid>
        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">Добавить в портфель</Button>
        </Group>
      </Stack>
    </form>
  )
}
