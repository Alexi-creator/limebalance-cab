import { Button, Group, NumberInput, SimpleGrid, Stack, TextInput } from "@mantine/core"
import { useState } from "react"

const POPULAR = ["BTC", "ETH", "SOL", "TON", "USDT", "BNB", "XRP", "DOGE", "ADA", "AVAX"]
const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

interface Props {
  /** Called after successful validation and form submission */
  onSubmit: () => void
  /** Called when the "Cancel" button is clicked */
  onCancel: () => void
}

/**
 * Form for adding a crypto asset to the investment portfolio.
 * Lets you enter a ticker (with quick selection from the top 10), quantity, and average purchase price.
 */
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
          label="Asset ticker"
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
            label="Quantity"
            required
            min={0}
            placeholder="0.5"
            value={amount}
            onChange={setAmount}
            decimalScale={8}
          />
          <NumberInput
            label="Average price"
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
            Cancel
          </Button>
          <Button type="submit">Add to portfolio</Button>
        </Group>
      </Stack>
    </form>
  )
}
