import { Button, Group, NumberInput, Select, SimpleGrid, Stack } from "@mantine/core"
import { useState } from "react"

const ACCOUNTS = ["Тинькофф", "Сбер", "Альфа", "Кэш", "Накопительный"]
const FOOTER_STYLE = { borderTop: "1px solid var(--mantine-color-default-border)" }

interface Props {
  /** Вызывается после успешной валидации и отправки формы */
  onSubmit: () => void
  /** Вызывается при нажатии кнопки «Отмена» */
  onCancel: () => void
}

/**
 * Форма перевода средств между счетами пользователя.
 * Блокирует отправку, если выбраны одинаковые счёт-источник и счёт-получатель.
 */
export function TransferForm({ onSubmit, onCancel }: Props) {
  const [from, setFrom] = useState<string | null>("Тинькофф")
  const [to, setTo] = useState<string | null>("Сбер")
  const [amount, setAmount] = useState<number | string>("")
  const sameAcc = from === to

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount && !sameAcc) onSubmit()
  }

  return (
    <form onSubmit={submit}>
      <Stack gap="md">
        <NumberInput
          label="Сумма"
          required
          autoFocus
          size="md"
          value={amount}
          onChange={setAmount}
          min={0}
          thousandSeparator=" "
          suffix=" ₽"
          styles={{ input: { fontFamily: "var(--mantine-font-family-monospace)", fontSize: 22 } }}
        />
        <SimpleGrid cols={2}>
          <Select
            label="Из счёта"
            data={ACCOUNTS}
            value={from}
            onChange={setFrom}
            error={sameAcc ? " " : undefined}
          />
          <Select
            label="В счёт"
            data={ACCOUNTS}
            value={to}
            onChange={setTo}
            error={sameAcc ? "Должны быть разные" : undefined}
          />
        </SimpleGrid>
        <Group justify="flex-end" pt="sm" style={FOOTER_STYLE}>
          <Button variant="default" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit" disabled={sameAcc}>
            Перевести
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
